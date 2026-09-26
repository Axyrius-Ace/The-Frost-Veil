import Phaser from 'phaser';
import { AREAS, type AreaDef, type WorldObject } from '../data/areas';
import { EVIDENCE } from '../data/story';
import { NPC_NAMES } from '../data/dialogues';
import { store } from '../systems/GameStore';
import { audio } from '../systems/AudioSystem';
import { touchInput } from '../systems/TouchInput';
import { Lighting } from '../systems/Lighting';
import { angleDiff, castCone, lineOfSight, rectsToSegments, type Segment } from '../systems/Raycast';
import { startDialogue } from '../systems/DialogueSystem';
import type { Point, Rect } from '../systems/types';

const VIEW_W = 480, VIEW_H = 270;
const CONE_HALF = 0.43;
const CONE_RANGE = 150;
const DRAIN_PER_SEC = 100 / 240; // a full battery lasts four minutes of beam
const BATTERY_PICKUP = 40;
const WALK = 56, RUN = 92;

type Dir = 'down' | 'up' | 'left' | 'right';
type Visual = Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
interface LiveObj { def: WorldObject; area: string; sprite?: Visual; lit: number; removed: boolean; seen: boolean; }

const DEPTH = { ground: 0, prints: 1, decal: 2, fog: 905, snowBack: 910, light: 1000, haze: 1001, snowFront: 1002, vignette: 1003 };

const dirAngle = (d: Dir) => (d === 'down' ? Math.PI / 2 : d === 'up' ? -Math.PI / 2 : d === 'left' ? Math.PI : 0);
const angleToDir = (a: number): Dir => {
  const d = Phaser.Math.Angle.Wrap(a);
  if (d > -Math.PI / 4 && d <= Math.PI / 4) return 'right';
  if (d > Math.PI / 4 && d <= (3 * Math.PI) / 4) return 'down';
  if (d > -(3 * Math.PI) / 4 && d <= -Math.PI / 4) return 'up';
  return 'left';
};

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite;
  private area!: AreaDef;
  private segments: Segment[] = [];
  private live: LiveObj[] = [];
  private lighting!: Lighting;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private fogA!: Phaser.GameObjects.TileSprite;
  private fogB!: Phaser.GameObjects.TileSprite;
  private snowBack!: Phaser.GameObjects.Particles.ParticleEmitter;
  private snowFront!: Phaser.GameObjects.Particles.ParticleEmitter;
  private footprints: Phaser.GameObjects.Image[] = [];
  private facing: Dir = 'down';
  private aim = Math.PI / 2;
  private walkTime = 0;
  private stepTimer = 0;
  private footSide = 0;
  private battery = 100;
  private flashOn = true;
  private flicker = 1;
  private pointerAt = -99999;
  private transitioning = false;
  private touchDownX = 0;
  private touchDownY = 0;
  private touchDownT = -99999;
  private cone: Point[] | null = null;
  private target: LiveObj | null = null;
  private lastPrompt: string | null = null;
  private lastBatteryInt = -1;
  private secAcc = 0;

  constructor() { super('World'); }

  create() {
    const s = store.get();
    this.live = []; this.footprints = []; this.target = null; this.lastPrompt = null;
    this.transitioning = false; this.lastBatteryInt = -1; this.secAcc = 0;
    this.battery = s.battery; this.flashOn = s.flashlightOn && s.battery > 0;

    for (const a of Object.values(AREAS)) this.buildArea(a);

    this.player = this.add.sprite(s.player.x, s.player.y, 'detective', 0).setOrigin(0.5, 1);

    // atmosphere layers
    this.fogA = this.add.tileSprite(0, 0, VIEW_W, VIEW_H, 'fog').setOrigin(0).setScrollFactor(0).setDepth(DEPTH.fog).setAlpha(0.3);
    this.snowBack = this.add.particles(0, 0, 'flake', {
      x: { min: -60, max: VIEW_W + 60 }, y: -8, lifespan: 9000,
      speedY: { min: 20, max: 44 }, speedX: { min: -34, max: -8 }, accelerationX: { min: -4, max: 3 },
      scale: { min: 0.5, max: 1 }, alpha: { min: 0.55, max: 1 }, frequency: 22, quantity: 2, advance: 9000,
    });
    this.snowBack.setScrollFactor(0).setDepth(DEPTH.snowBack);
    this.lighting = new Lighting(this, VIEW_W, VIEW_H, DEPTH.light);
    this.fogB = this.add.tileSprite(0, 0, VIEW_W, VIEW_H, 'fog').setOrigin(0).setScrollFactor(0).setDepth(DEPTH.haze).setAlpha(0.07);
    this.snowFront = this.add.particles(0, 0, 'flake_big', {
      x: { min: -60, max: VIEW_W + 60 }, y: -8, lifespan: 5000,
      speedY: { min: 55, max: 85 }, speedX: { min: -60, max: -25 },
      alpha: { min: 0.15, max: 0.4 }, frequency: 110, quantity: 1, advance: 5000,
    });
    this.snowFront.setScrollFactor(0).setDepth(DEPTH.snowFront);
    this.add.image(0, 0, 'vignette').setOrigin(0).setScrollFactor(0).setDepth(DEPTH.vignette);

    // input: capture disabled so React text fields keep working
    const kb = this.input.keyboard!;
    this.keys = kb.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SHIFT', false) as Record<string, Phaser.Input.Keyboard.Key>;
    const onF = () => this.toggleFlashlight();
    const onE = () => this.interact();
    kb.on('keydown-F', onF);
    kb.on('keydown-E', onE);
    kb.on('keydown-SPACE', onE);
    const onMove = (p: Phaser.Input.Pointer) => {
      // Ignore touch drags: on mobile the virtual stick lives in the DOM overlay
      // and canvas touches are used for aiming only while pressed.
      if (p.wasTouch) return;
      this.pointerAt = this.time.now;
    };
    const onDown = (p: Phaser.Input.Pointer) => {
      this.pointerAt = this.time.now;
      if (p.rightButtonDown()) { this.toggleFlashlight(); return; }
      if (p.wasTouch) { this.touchDownX = p.x; this.touchDownY = p.y; this.touchDownT = this.time.now; }
    };
    const onUp = (p: Phaser.Input.Pointer) => {
      if (!p.wasTouch) return;
      // Quick tap on the canvas = interact (lets mobile players talk / pick up without the button).
      const dt = this.time.now - this.touchDownT;
      const moved = Math.hypot(p.x - this.touchDownX, p.y - this.touchDownY);
      if (dt < 350 && moved < 14) this.interact();
    };
    this.input.on('pointermove', onMove);
    this.input.on('pointerdown', onDown);
    this.input.on('pointerup', onUp);
    this.input.mouse?.disableContextMenu();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      kb.off('keydown-F', onF); kb.off('keydown-E', onE); kb.off('keydown-SPACE', onE);
      this.input.off('pointermove', onMove); this.input.off('pointerdown', onDown); this.input.off('pointerup', onUp);
      kb.removeAllKeys(false);
    });

    this.setArea(s.area, true);
    this.cameras.main.fadeIn(900, 0, 0, 0);
    store.set({ battery: this.battery, flashlightOn: this.flashOn });
  }

  // ------------------------------------------------------------------ world build
  private buildArea(a: AreaDef) {
    this.add.image(a.bounds.x, a.bounds.y, `ground_${a.id}`).setOrigin(0).setDepth(DEPTH.ground);
    for (const b of a.buildings) this.add.image(b.x, b.y, `bld_${b.id}`).setOrigin(0).setDepth(b.y + b.h);
    for (const p of a.pines) this.add.image(p.x, p.y, 'pine').setOrigin(0.5, 1).setDepth(p.y);
    for (const l of a.lamps) if (l.post) this.add.image(l.x, l.y, 'lamp').setOrigin(0.5, 1).setDepth(l.y);
    const collected = store.get().collected;
    for (const o of a.objects) {
      if (!o.keep && collected.includes(o.id)) continue;
      let sprite: Visual | undefined;
      if (o.texture) {
        const isNpc = o.kind === 'npc';
        sprite = (isNpc ? this.add.sprite(o.x, o.y, o.texture, 0) : this.add.image(o.x, o.y, o.texture));
        if (isNpc || o.id === 'fountain') sprite.setOrigin(0.5, 1);
        const flat = o.kind === 'decor' && o.id !== 'fountain' || (o.hidden && o.kind !== 'npc') || o.id === 'body' || o.id === 'scarf';
        sprite.setDepth(flat ? DEPTH.decal : o.y);
        if (o.flipX) sprite.setFlipX(true);
        if (o.hidden) sprite.setAlpha(0);
        if (isNpc && o.x > a.bounds.x + a.bounds.w / 2) sprite.setFlipX(true);
      }
      this.live.push({ def: o, area: a.id, sprite, lit: 0, removed: false, seen: false });
    }
  }

  private setArea(id: string, instant: boolean) {
    this.area = AREAS[id] ?? AREAS.town;
    const b = this.area.bounds;
    const edges: Rect[] = [{ x: b.x - 2, y: b.y - 2, w: b.w + 4, h: 2 }, { x: b.x - 2, y: b.y + b.h, w: b.w + 4, h: 2 },
      { x: b.x - 2, y: b.y, w: 2, h: b.h }, { x: b.x + b.w, y: b.y, w: 2, h: b.h }];
    this.segments = rectsToSegments([...this.area.lightBlockers, ...edges]);
    const cam = this.cameras.main;
    if (this.area.interior) {
      cam.stopFollow(); cam.removeBounds(); cam.centerOn(b.x + b.w / 2, b.y + b.h / 2);
      this.snowBack.stop(); this.snowFront.stop(); this.snowBack.setVisible(false); this.snowFront.setVisible(false);
      this.fogA.setAlpha(0.08); this.fogB.setAlpha(0.03);
    } else {
      cam.setBounds(b.x, b.y, b.w, b.h);
      cam.startFollow(this.player, true, 0.09, 0.09);
      cam.centerOn(this.player.x, this.player.y);
      this.snowBack.start(); this.snowFront.start(); this.snowBack.setVisible(true); this.snowFront.setVisible(true);
      this.fogA.setAlpha(0.3); this.fogB.setAlpha(0.07);
    }
    audio.setInterior(this.area.interior);
    store.set({ area: this.area.id });
    if (!instant || this.area.id !== 'town') store.banner(this.area.name);
    else store.banner('Hollowmere · 11:58 PM');
  }

  // ------------------------------------------------------------------ movement
  private blocked(x: number, y: number): boolean {
    const hx = x - 4, hy = y - 4, hw = 8, hh = 4;
    const b = this.area.bounds;
    if (hx < b.x || hy < b.y || hx + hw > b.x + b.w || hy + hh > b.y + b.h) return true;
    for (const r of this.area.obstacles) if (hx < r.x + r.w && hx + hw > r.x && hy < r.y + r.h && hy + hh > r.y) return true;
    return false;
  }

  private onIce(): boolean {
    const { x, y } = this.player;
    return this.area.roads.some(r => x >= r.x + 3 && x <= r.x + r.w - 3 && y >= r.y + 3 && y <= r.y + r.h - 3);
  }

  private dropFootprint() {
    if (this.area.interior || this.onIce()) return;
    this.footSide ^= 1;
    const side = this.facing === 'left' || this.facing === 'right' ? 0 : (this.footSide ? 2 : -2);
    const vside = this.facing === 'left' || this.facing === 'right' ? (this.footSide ? 1 : -1) : 0;
    const fp = this.add.image(Math.round(this.player.x + side), Math.round(this.player.y - 1 + vside), 'footprint').setDepth(DEPTH.prints).setAlpha(0.8);
    this.tweens.add({ targets: fp, alpha: 0, delay: 12000, duration: 16000, onComplete: () => fp.destroy() });
    this.footprints.push(fp);
    if (this.footprints.length > 90) { const old = this.footprints.shift(); old?.destroy(); }
  }

  // ------------------------------------------------------------------ flashlight
  private toggleFlashlight() {
    const s = store.get();
    if (s.ui || s.screen !== 'playing' || this.transitioning || store.locked()) return;
    if (!this.flashOn && this.battery <= 0.5) { store.toast('Dead battery. Find a fresh one.'); audio.click(); return; }
    this.flashOn = !this.flashOn;
    audio.flashlight(this.flashOn);
    store.set({ flashlightOn: this.flashOn });
  }

  private isLit(x: number, y: number): boolean {
    if (!this.cone || !this.flashOn || this.flicker < 0.5) return false;
    const ox = this.player.x, oy = this.player.y - 5;
    const d = Math.hypot(x - ox, y - oy);
    if (d > CONE_RANGE * 0.92) return false;
    if (d > 10 && Math.abs(angleDiff(Math.atan2(y - oy, x - ox), this.aim)) > CONE_HALF) return false;
    return lineOfSight(ox, oy, x, y, this.segments);
  }

  // ------------------------------------------------------------------ interaction
  private promptFor(d: WorldObject): string {
    switch (d.kind) {
      case 'door': return d.to === 'town' ? 'Step outside' : `Enter ${d.label ?? ''}`;
      case 'npc': return `Talk to ${NPC_NAMES[d.npc ?? ''] ?? '...'}`;
      case 'battery': return 'Take battery';
      case 'evidence': return store.has(d.evidence ?? '') ? `Look at ${EVIDENCE[d.evidence ?? '']?.name ?? 'it'}` : 'Examine';
      case 'examine': return `Examine: ${d.title ?? ''}`;
      default: return '';
    }
  }

  private updateTarget(frozen: boolean) {
    let best: LiveObj | null = null, bd = Infinity;
    if (!frozen) {
      const px = this.player.x, py = this.player.y - 4;
      for (const o of this.live) {
        if (o.removed || o.area !== this.area.id || o.def.kind === 'decor') continue;
        if (o.def.hidden && o.lit < 0.5) continue;
        const r = o.def.radius ?? (o.def.kind === 'npc' ? 34 : 20);
        const d = Math.hypot(px - o.def.x, py - o.def.y);
        if (d < r && d < bd) { best = o; bd = d; }
      }
    }
    this.target = best;
    const prompt = best ? this.promptFor(best.def) : null;
    if (prompt !== this.lastPrompt) { this.lastPrompt = prompt; store.set({ prompt }); }
  }

  private removeObj(o: LiveObj) {
    o.removed = true;
    if (o.sprite) this.tweens.add({ targets: o.sprite, alpha: 0, y: o.sprite.y - 6, duration: 250, onComplete: () => o.sprite?.destroy() });
    store.collect(o.def.id);
  }

  private interact() {
    const s = store.get();
    if (s.ui || s.screen !== 'playing' || this.transitioning || store.locked()) return;
    const o = this.target;
    if (!o) return;
    const d = o.def;
    switch (d.kind) {
      case 'door': this.goThrough(d); break;
      case 'npc': audio.click(); if (d.npc) startDialogue(d.npc); break;
      case 'battery':
        this.battery = Math.min(100, this.battery + BATTERY_PICKUP);
        this.lastBatteryInt = -1;
        this.removeObj(o); audio.pickup();
        store.toast(`Battery +${BATTERY_PICKUP}%`);
        break;
      case 'evidence': {
        const ev = EVIDENCE[d.evidence ?? ''];
        if (!ev) break;
        const isNew = store.addEvidence(ev.id);
        if (isNew) audio.discover(); else audio.click();
        if (d.flag) store.addFlag(d.flag);
        store.set({ ui: 'inspect', inspect: { title: ev.name, text: d.text ?? ev.description, tag: isNew ? 'NEW EVIDENCE' : 'EVIDENCE' } });
        if (!d.keep) this.removeObj(o);
        break;
      }
      case 'examine':
        audio.click();
        if (d.flag) store.addFlag(d.flag);
        store.set({ ui: 'inspect', inspect: { title: d.title ?? '', text: d.text ?? '' } });
        break;
      default: break;
    }
  }

  private goThrough(d: WorldObject) {
    if (!d.to || !d.spawn) return;
    this.transitioning = true;
    audio.door();
    const cam = this.cameras.main;
    cam.fadeOut(320, 0, 0, 0);
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.player.setPosition(d.spawn!.x, d.spawn!.y);
      this.facing = d.to === 'town' ? 'down' : 'up';
      this.aim = dirAngle(this.facing);
      this.setArea(d.to!, false);
      cam.fadeIn(420, 0, 0, 0);
      this.transitioning = false;
      store.silent({ player: { x: this.player.x, y: this.player.y } });
      store.autosave();
    });
  }

  // ------------------------------------------------------------------ loop
  update(time: number, delta: number) {
    const dt = Math.min(delta, 50) / 1000;
    const s = store.get();
    const frozen = s.ui !== null || s.screen !== 'playing' || this.transitioning;
    const k = this.keys;

    // Queued touch-button presses (consumed once per frame).
    if (!frozen) {
      if (touchInput.consumeFlash()) this.toggleFlashlight();
      if (touchInput.consumeInteract()) this.interact();
      // While a finger drags on the canvas, keep aiming at it.
      const ap = this.input.activePointer;
      if (ap.isDown && ap.wasTouch) this.pointerAt = time;
    } else {
      touchInput.consumeFlash();
      touchInput.consumeInteract();
    }

    let vx = 0, vy = 0;
    if (!frozen) {
      if (k.A.isDown || k.LEFT.isDown) vx -= 1;
      if (k.D.isDown || k.RIGHT.isDown) vx += 1;
      if (k.W.isDown || k.UP.isDown) vy -= 1;
      if (k.S.isDown || k.DOWN.isDown) vy += 1;
      // Virtual joystick (mobile). Analog: magnitude controls speed.
      if (touchInput.active) { vx += touchInput.moveX; vy += touchInput.moveY; }
    }
    const moving = vx !== 0 || vy !== 0;
    const stickMag = Math.min(1, Math.hypot(touchInput.moveX, touchInput.moveY));
    const run = k.SHIFT.isDown || touchInput.run || (touchInput.active && stickMag > 0.92);
    if (moving) {
      const len = Math.hypot(vx, vy) || 1;
      // Analog stick: small deflection = slow walk. Keyboard input stays at full speed.
      const mag = touchInput.active ? Math.min(1, len) : 1;
      const sp = (run ? RUN : WALK) * mag * dt;
      const nx = (vx / len) * sp, ny = (vy / len) * sp;
      if (!this.blocked(this.player.x + nx, this.player.y)) this.player.x += nx;
      if (!this.blocked(this.player.x, this.player.y + ny)) this.player.y += ny;
      this.facing = Math.abs(vx) > Math.abs(vy) ? (vx < 0 ? 'left' : 'right') : (vy < 0 ? 'up' : 'down');
      this.walkTime += dt * (run ? 1.5 : 1);
    } else this.walkTime = 0;

    // aim: mouse if recently used, otherwise facing
    const cam = this.cameras.main;
    let targetAim = dirAngle(this.facing);
    if (!frozen && time - this.pointerAt < 3000) {
      const p = this.input.activePointer;
      const wp = cam.getWorldPoint(p.x, p.y);
      targetAim = Math.atan2(wp.y - (this.player.y - 5), wp.x - this.player.x);
      if (!moving) this.facing = angleToDir(targetAim);
    }
    this.aim = this.aim + angleDiff(targetAim, this.aim) * Math.min(1, dt * 12);

    const base = this.facing === 'down' ? 0 : this.facing === 'up' ? 3 : 6;
    this.player.setFrame(moving ? base + 1 + (Math.floor(this.walkTime * 7) % 2) : base);
    this.player.setFlipX(this.facing === 'left');
    this.player.setDepth(this.player.y);

    if (moving) {
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        this.stepTimer = run ? 0.25 : 0.37;
        const icy = !this.area.interior && this.onIce();
        audio.footstep(icy && !this.area.interior);
        this.dropFootprint();
        if (icy && Math.random() < 0.05) audio.iceCrack(0.8);
      }
    } else this.stepTimer = 0.06;

    // battery
    if (!frozen && this.flashOn) {
      this.battery = Math.max(0, this.battery - DRAIN_PER_SEC * dt);
      if (this.battery <= 0) {
        this.flashOn = false; audio.flashlight(false);
        store.set({ flashlightOn: false });
        store.toast('The flashlight dies. Find batteries.');
      }
    }
    if (this.flashOn && this.battery < 15) {
      if (Math.random() < 0.06 + (15 - this.battery) * 0.004) this.flicker = 0.1 + Math.random() * 0.4;
      else this.flicker += (1 - this.flicker) * 0.25;
    } else this.flicker = 1;
    const bi = Math.ceil(this.battery);
    if (bi !== this.lastBatteryInt) { this.lastBatteryInt = bi; store.set({ battery: this.battery }); }
    else store.silent({ battery: this.battery });
    store.silent({ player: { x: this.player.x, y: this.player.y } });
    if (!frozen) { this.secAcc += dt; if (this.secAcc >= 1) { this.secAcc -= 1; store.silent({ playTime: s.playTime + 1 }); } }

    // flashlight cone + hidden clues
    const ox = this.player.x, oy = this.player.y - 5;
    this.cone = this.flashOn ? castCone(ox, oy, this.aim, CONE_HALF, CONE_RANGE, this.segments, 60) : null;
    for (const o of this.live) {
      if (o.removed || o.area !== this.area.id || !o.def.hidden || !o.sprite) continue;
      const lit = this.isLit(o.def.x, o.def.y) ? 1 : 0;
      o.lit += (lit - o.lit) * Math.min(1, dt * (lit ? 5 : 2.2));
      const pulse = o.def.kind === 'evidence' ? 0.7 + 0.3 * Math.sin(time / 170 + o.def.x) : 1;
      o.sprite.setAlpha(o.lit * pulse);
      if (lit && !o.seen && o.def.kind === 'evidence') { o.seen = true; audio.shimmer(); }
    }

    // NPC breathing
    const breath = Math.floor(time / 800) % 2;
    for (const o of this.live) if (o.def.kind === 'npc' && o.sprite && o.area === this.area.id) (o.sprite as Phaser.GameObjects.Sprite).setFrame(breath);

    this.lighting.render(cam, this.area, this.cone, ox, oy, this.flicker, CONE_RANGE, time);

    this.fogA.tilePositionX = cam.scrollX * 0.6 + time * 0.008;
    this.fogA.tilePositionY = cam.scrollY * 0.6;
    this.fogB.tilePositionX = cam.scrollX * 1.1 + time * 0.015;
    this.fogB.tilePositionY = cam.scrollY * 1.1 + time * 0.003;

    this.updateTarget(frozen);
  }
}
