import Phaser from 'phaser';
import { Lighting } from '../systems/Lighting';
import { Weather } from '../systems/Weather';
import { buildWorld } from './WorldBuilder';
import { AREAS, isOnIce } from '../data/world';
import { DEPTH, BATTERY_DRAIN_PER_SEC, BATTERY_PICKUP, FLASH_RANGE, FLASH_HALF_ANGLE, WALK_SPEED, RUN_SPEED } from '../systems/constants';
import { getState, setState, setMode, toast, addEvidence } from '../systems/store';
import { consumeFlash, consumeInteract, touchState } from '../systems/touch';
import { resolveStart } from '../systems/dialogue';
import { saveGame } from '../systems/save';
import { audio } from '../systems/audio';

type Facing = 'down' | 'up' | 'left' | 'right';
export interface Interactable {
  id: string; x: number; y: number; r: number; label: string;
  hidden?: boolean; reveal: number; active: boolean;
  sprite?: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
  action: () => void;
}
const FACING_ANGLE: Record<Facing, number> = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };

export class GameScene extends Phaser.Scene {
  player!: Phaser.Physics.Arcade.Sprite;
  lighting!: Lighting;
  weather!: Weather;
  walls!: Phaser.Physics.Arcade.StaticGroup;
  interactables: Interactable[] = [];
  hiddenDecals: Phaser.GameObjects.Image[] = [];
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private facing: Facing = 'down';
  private aim = Math.PI / 2;
  private battery = 100;
  private flashOn = false;
  private areaId = 'town';
  private transitioning = false;
  private stepT = 0;
  private stepSide = 1;
  private lastPointerMove = -99999;
  private lastPrompt: string | null = null;
  private syncT = 0;
  private batterySynced = 100;
  private steps: Phaser.GameObjects.Image[] = [];
  private stepIdx = 0;

  constructor() { super('Game'); }

  create() {
    this.interactables = []; this.hiddenDecals = []; this.steps = []; this.transitioning = false;
    const s = getState();
    this.battery = s.battery; this.batterySynced = s.battery; this.flashOn = s.flashlightOn && s.battery > 0;
    this.cameras.main.setBackgroundColor('#010208');
    this.physics.world.setBounds(0, 0, 2200, 1000);
    this.walls = this.physics.add.staticGroup();
    this.lighting = new Lighting(this);

    buildWorld(this);

    for (let i = 0; i < 70; i++) this.steps.push(this.add.image(-50, -50, 'step').setDepth(DEPTH.STEPS).setAlpha(0));

    this.player = this.physics.add.sprite(s.player.x, s.player.y, 'detective', 'down-0');
    this.player.setOrigin(0.5, 1);
    (this.player.body as Phaser.Physics.Arcade.Body).setSize(8, 5).setOffset(4, 19);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.walls);
    this.createAnims();

    this.weather = new Weather(this);

    this.keys = this.input.keyboard!.addKeys({
      up: 'W', down: 'S', left: 'A', right: 'D', up2: 'UP', down2: 'DOWN', left2: 'LEFT', right2: 'RIGHT',
      interact: 'E', flash: 'F', run: 'SHIFT',
    }, false) as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.on('pointermove', () => { this.lastPointerMove = this.time.now; });
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => { if (p.rightButtonDown() && getState().mode === 'playing') this.toggleFlash(); });
    this.input.mouse?.disableContextMenu();

    this.scale.on('resize', this.onResize, this);
    this.events.on(Phaser.Scenes.Events.POST_UPDATE, this.syncLight, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.onResize, this);
      this.events.off(Phaser.Scenes.Events.POST_UPDATE, this.syncLight, this);
      this.input.keyboard?.removeAllKeys(false);
    });

    this.setArea(s.area);
    this.onResize();
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
    this.cameras.main.centerOn(this.player.x, this.player.y);
    this.cameras.main.fadeIn(1400, 0, 0, 0);
    setState({ flashlightOn: this.flashOn });
  }

  /* ---------------------------------------------------------------- helpers */
  addWall(x: number, y: number, w: number, h: number) {
    const z = this.add.zone(x + w / 2, y + h / 2, w, h);
    this.physics.add.existing(z, true);
    this.walls.add(z);
  }

  addInteractable(o: Omit<Interactable, 'reveal' | 'active'>): Interactable {
    const it: Interactable = { ...o, reveal: o.hidden ? 0 : 1, active: true };
    this.interactables.push(it);
    return it;
  }

  private createAnims() {
    if (this.anims.exists('walk-down')) return;
    for (const d of ['down', 'up', 'left', 'right']) {
      this.anims.create({ key: `walk-${d}`, frames: [1, 0, 2, 0].map((f) => ({ key: 'detective', frame: `${d}-${f}` })), frameRate: 8, repeat: -1 });
    }
  }

  private onResize() {
    const cam = this.cameras.main;
    const zoom = Math.max(2, Math.floor(this.scale.height / 250));
    cam.setZoom(zoom);
    this.applyBounds();
  }

  private applyBounds() {
    const cam = this.cameras.main; const b = AREAS[this.areaId].bounds;
    const vw = this.scale.width / cam.zoom, vh = this.scale.height / cam.zoom;
    const bw = Math.max(b.w, vw), bh = Math.max(b.h, vh);
    cam.setBounds(b.x + b.w / 2 - bw / 2, b.y + b.h / 2 - bh / 2, bw, bh);
  }

  setArea(id: string) {
    const a = AREAS[id] ?? AREAS.town;
    this.areaId = a.id;
    this.lighting.ambient = a.ambient;
    this.applyBounds();
    this.weather.setIndoor(a.indoor);
    audio.setIndoor(a.indoor);
    setState({ area: a.id, areaName: a.name });
  }

  travel(to: string, x: number, y: number, face: Facing = 'down') {
    if (this.transitioning) return;
    this.transitioning = true;
    audio.door();
    this.player.setVelocity(0, 0);
    const cam = this.cameras.main;
    cam.fadeOut(260, 0, 0, 0);
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.player.setPosition(x, y);
      this.facing = face; this.aim = FACING_ANGLE[face];
      this.setArea(to);
      cam.centerOn(x, y);
      cam.fadeIn(320, 0, 0, 0);
      this.transitioning = false;
      setState({ player: { x, y } });
      saveGame('auto', true);
    });
  }

  startDialogue(npc: string) {
    this.player.setVelocity(0, 0);
    const s = getState();
    setState({ dialogue: { npc, node: resolveStart(npc) }, talkedTo: s.talkedTo.includes(npc) ? s.talkedTo : [...s.talkedTo, npc] });
    setMode('dialogue');
    audio.click();
  }

  onEvidenceFound(id: string) { addEvidence(id); saveGame('auto', true); }

  onBattery(id: string) {
    this.battery = Math.min(100, this.battery + BATTERY_PICKUP);
    setState((s) => ({ pickups: [...s.pickups, id], battery: this.battery }));
    this.batterySynced = this.battery;
    audio.battery();
    toast(`Battery found. Flashlight at ${Math.round(this.battery)}%.`, 'info');
  }

  private toggleFlash() {
    if (!this.flashOn && this.battery <= 0.5) { toast("Dead battery. I need to find another one.", 'warn'); audio.flashlight(false); return; }
    this.flashOn = !this.flashOn;
    audio.flashlight(this.flashOn);
    setState({ flashlightOn: this.flashOn });
  }

  private surface(): 'snow' | 'ice' | 'wood' {
    if (AREAS[this.areaId].indoor) return 'wood';
    return isOnIce(this.player.x, this.player.y) ? 'ice' : 'snow';
  }

  private leaveStep() {
    const img = this.steps[this.stepIdx]; this.stepIdx = (this.stepIdx + 1) % this.steps.length;
    const perp = FACING_ANGLE[this.facing] + Math.PI / 2; this.stepSide *= -1;
    img.setPosition(this.player.x + Math.cos(perp) * 2 * this.stepSide, this.player.y - 1 + Math.sin(perp) * 2 * this.stepSide).setAlpha(0.6);
    this.tweens.killTweensOf(img);
    this.tweens.add({ targets: img, alpha: 0, duration: 26000, ease: 'Quad.in' });
  }

  /* ------------------------------------------------- post-physics light sync */
  /**
   * Runs on POST_UPDATE, i.e. after the arcade body has integrated this
   * frame's velocity. The beam origin, the darkness mask and the cone glow
   * are all drawn from the exact player transform that gets rendered, so the
   * light can never trail one step behind the sprite while walking/running.
   */
  private syncLight(time: number, delta: number) {
    const dt = Math.min(delta, 50) / 1000;
    if (!this.player || !this.lighting) return;
    const px = this.player.x, py = this.player.y - 11;
    let power = 1;
    if (this.battery < 15) power = Math.random() < 0.07 ? 0.15 : 0.55 + this.battery / 34;
    this.lighting.flash = { on: this.flashOn, x: px, y: py, angle: this.aim, range: FLASH_RANGE * (this.battery < 15 ? 0.78 : 1), half: FLASH_HALF_ANGLE, power };
    this.lighting.aura.x = px; this.lighting.aura.y = py + 4;
    this.lighting.update(time);

    // Hidden things fade in only inside the beam
    for (const it of this.interactables) {
      if (!it.active || !it.hidden) continue;
      const lit = this.lighting.isLit(it.x, it.y) > 0 ? 1 : 0;
      it.reveal = Phaser.Math.Linear(it.reveal, lit, lit ? 6 * dt : 1.5 * dt);
      it.sprite?.setAlpha(it.reveal);
    }
    for (const d of this.hiddenDecals) {
      const lit = this.lighting.isLit(d.x, d.y) > 0 ? 0.95 : 0;
      d.setAlpha(Phaser.Math.Linear(d.alpha, lit, lit ? 6 * dt : 1.5 * dt));
    }
  }

  /* ----------------------------------------------------------------- update */
  update(time: number, delta: number) {
    const dt = Math.min(delta, 50) / 1000;
    const s = getState();
    const playing = s.mode === 'playing' && !this.transitioning;
    const k = this.keys; const body = this.player.body as Phaser.Physics.Arcade.Body;

    // Movement
    let vx = 0, vy = 0;
    if (playing) {
      if (k.left.isDown || k.left2.isDown) vx -= 1;
      if (k.right.isDown || k.right2.isDown) vx += 1;
      if (k.up.isDown || k.up2.isDown) vy -= 1;
      if (k.down.isDown || k.down2.isDown) vy += 1;
      // Virtual joystick (touch / Android)
      if (vx === 0 && vy === 0 && (touchState.x !== 0 || touchState.y !== 0)) {
        vx = touchState.x;
        vy = touchState.y;
      }
    }
    const moving = vx !== 0 || vy !== 0;
    const run = k.run.isDown || touchState.run;
    if (moving) {
      const len = Math.hypot(vx, vy); const sp = run ? RUN_SPEED : WALK_SPEED;
      body.setVelocity((vx / len) * sp, (vy / len) * sp);
      this.facing = Math.abs(vx) > Math.abs(vy) ? (vx < 0 ? 'left' : 'right') : vy < 0 ? 'up' : 'down';
      this.player.anims.play(`walk-${this.facing}`, true);
      this.player.anims.timeScale = run ? 1.5 : 1;
    } else {
      body.setVelocity(0, 0);
      this.player.anims.stop();
      this.player.setFrame(`${this.facing}-0`);
    }

    // Flashlight aim: mouse if recently moved, otherwise movement direction.
    // A touch only aims while the finger is held down on the canvas — once it
    // lifts, the beam snaps back to the movement direction instead of sticking
    // to the stale touch point while steering with the virtual joystick.
    const ptr = this.input.activePointer;
    if (ptr.isDown && ptr.wasTouch) this.lastPointerMove = time;
    const px = this.player.x, py = this.player.y - 11;
    let target = moving ? Math.atan2(vy, vx) : FACING_ANGLE[this.facing];
    if (time - this.lastPointerMove < 3000 && (!ptr.wasTouch || ptr.isDown)) {
      const wp = ptr.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
      target = Math.atan2(wp.y - py, wp.x - px);
      if (!moving) { const a = Phaser.Math.Angle.Wrap(target); this.facing = Math.abs(a) < Math.PI / 4 ? 'right' : Math.abs(a) > (3 * Math.PI) / 4 ? 'left' : a > 0 ? 'down' : 'up'; this.player.setFrame(`${this.facing}-0`); }
    }
    // Track fast enough that the beam stays glued to the sprite when turning:
    // near-instant while moving, still smooth when following the mouse.
    const rate = moving ? 18 : 12;
    this.aim += Phaser.Math.Angle.Wrap(target - this.aim) * Math.min(1, dt * rate);

    if (playing && (Phaser.Input.Keyboard.JustDown(k.flash) || consumeFlash())) this.toggleFlash();

    // Battery
    if (this.flashOn && playing) {
      this.battery = Math.max(0, this.battery - BATTERY_DRAIN_PER_SEC * dt);
      if (this.battery <= 0) { this.flashOn = false; audio.flashlight(false); toast('The flashlight dies. The dark closes in.', 'warn'); setState({ flashlightOn: false }); }
    }
    if (Math.abs(this.battery - this.batterySynced) >= 0.5) { this.batterySynced = this.battery; setState({ battery: this.battery }); }

    // Nearest interactable
    let best: Interactable | null = null; let bd = Infinity;
    if (playing) for (const it of this.interactables) {
      if (!it.active || (it.hidden && it.reveal < 0.55)) continue;
      const d = Math.hypot(it.x - this.player.x, it.y - this.player.y);
      if (d < it.r && d < bd) { bd = d; best = it; }
    }
    const prompt = best ? best.label : null;
    if (prompt !== this.lastPrompt) { this.lastPrompt = prompt; setState({ prompt }); }
    if (playing && best && (Phaser.Input.Keyboard.JustDown(k.interact) || consumeInteract()) && performance.now() - s.modeChangedAt > 250) best.action();
    // Drain stale presses made while a menu was open so they never fire later.
    else if (!playing) { Phaser.Input.Keyboard.JustDown(k.interact); consumeInteract(); consumeFlash(); }

    // Footsteps + prints
    if (moving && playing) {
      this.stepT -= dt;
      if (this.stepT <= 0) {
        this.stepT = run ? 0.25 : 0.36;
        const surf = this.surface();
        audio.footstep(surf);
        if (surf === 'ice' && Math.random() < 0.3) audio.iceCrack();
        if (surf === 'snow') this.leaveStep();
      }
    }

    this.player.setDepth(this.player.y);
    this.weather.update(time, dt);

    // Periodic sync for save data
    if (playing) {
      this.syncT += dt;
      if (this.syncT >= 1) { this.syncT -= 1; setState((st) => ({ player: { x: Math.round(this.player.x), y: Math.round(this.player.y) }, playTime: st.playTime + 1, battery: this.battery })); }
    }
  }
}
