import Phaser from 'phaser';
import type { GameScene } from './GameScene';
import {
  WORLD, ROADS, PLAZA, BUILDINGS, AREAS, FURNITURE, AREA_LIGHTS, CLUE_SPOTS, NPC_SPOTS, BATTERIES,
  LAMPS, PROPS, EXIT_ROAD, BOOT_TRAIL, Rect,
} from '../data/world';
import { EVIDENCE } from '../data/evidence';
import { CHARACTERS } from '../data/characters';
import { DEPTH } from '../systems/constants';
import { getState, toast, setState, setMode, journal, setFlag } from '../systems/store';

/** Builds the town and all interiors from the data in data/world.ts. */
export function buildWorld(sc: GameScene) {
  const s = getState();
  const L = sc.lighting;
  sc.add.image(0, 0, 'ground').setOrigin(0).setDepth(DEPTH.GROUND);
  // Town perimeter: the blizzard is a wall of its own
  sc.addWall(-20, -20, WORLD.width + 40, 20); sc.addWall(-20, WORLD.height, WORLD.width + 40, 20);
  sc.addWall(-20, 0, 20, WORLD.height); sc.addWall(WORLD.width, 0, 20, WORLD.height);

  // ---- Buildings
  for (const b of BUILDINGS) {
    sc.add.image(b.x, b.y - (b.extraTop ?? 0), `bld-${b.id}`).setOrigin(0).setDepth(b.y + b.h);
    sc.addWall(b.x, b.y, b.w, b.h);
    L.addOccluder(b.x, b.y, b.w, b.h);
    for (const wnd of b.litWindows ?? []) L.addLight({ x: wnd.x, y: wnd.y + 8, radius: 36, intensity: 0.45, color: 0xffa040, flicker: 0.004 });
    if (b.door === undefined) continue;
    const dx = b.x + b.door, dy = b.y + b.h;
    if (b.enter) {
      L.addLight({ x: dx, y: dy + 2, radius: 34, intensity: 0.5, color: 0xffc070, flicker: 0.01 });
      const area = AREAS[b.enter];
      sc.addInteractable({ id: `door-${b.id}`, x: dx, y: dy + 4, r: 16, label: `Enter ${b.name}`, action: () => sc.travel(area.id, area.spawn!.x, area.spawn!.y, 'up') });
    } else if (b.locked) {
      const msg = b.locked;
      sc.addInteractable({ id: `door-${b.id}`, x: dx, y: dy + 4, r: 14, label: 'Knock', action: () => toast(msg, 'thought') });
    }
  }

  // ---- Street lamps
  for (const l of LAMPS) {
    sc.add.image(l.x, l.y, l.dead ? 'lamp-dead' : 'lamp').setOrigin(0.5, 1).setDepth(l.y);
    sc.addWall(l.x - 2, l.y - 3, 4, 3);
    if (!l.dead) {
      L.addLight({ x: l.x, y: l.y - 4, radius: 60, intensity: 0.68, color: 0xffb060, flicker: l.flicker ?? 0.004 });
      L.addLight({ x: l.x, y: l.y - 40, radius: 12, intensity: 0.65, color: 0xffd090, flicker: l.flicker ?? 0.004, glowScale: 1.6 });
    }
  }

  // ---- Props
  for (const p of PROPS) {
    sc.add.image(p.x, p.y, p.key).setOrigin(0.5, 1).setDepth(p.y);
    if (p.collide) sc.addWall(p.x - p.collide.w / 2, p.y - p.collide.h, p.collide.w, p.collide.h);
    if (p.examine) { const text = p.examine; sc.addInteractable({ id: `prop-${p.key}-${p.x}`, x: p.x, y: p.y + 2, r: 20, label: 'Examine', action: () => toast(text, 'thought') }); }
  }
  // Police lights
  L.addLight({ x: 460, y: 432, radius: 46, intensity: 0.8, color: 0xff2030, blink: 0.9 });
  L.addLight({ x: 480, y: 432, radius: 46, intensity: 0.8, color: 0x2050ff, blink: 0.9, blinkOffset: Math.PI });

  // ---- Crime scene tape
  const tape = sc.add.graphics().setDepth(DEPTH.DECAL + 1);
  const tr = { x: 598, y: 326, w: 64, h: 52 };
  for (let x = tr.x; x < tr.x + tr.w; x += 6) { tape.fillStyle((x / 6) % 2 ? 0xe8c020 : 0x1a1a1a, 1); tape.fillRect(x, tr.y + tr.h, 6, 1); tape.fillRect(x, tr.y, 6, 1); }
  for (let y = tr.y; y < tr.y + tr.h; y += 6) { tape.fillStyle((y / 6) % 2 ? 0xe8c020 : 0x1a1a1a, 1); tape.fillRect(tr.x, y, 1, 6); tape.fillRect(tr.x + tr.w, y, 1, 6); }
  for (const [x, y] of [[tr.x, tr.y], [tr.x + tr.w, tr.y], [tr.x, tr.y + tr.h], [tr.x + tr.w, tr.y + tr.h]]) sc.add.rectangle(x, y, 2, 7, 0xe06a20).setOrigin(0.5, 1).setDepth(y);

  // ---- The body
  sc.add.image(624, 354, 'body').setOrigin(0.5, 1).setDepth(354);
  sc.addWall(612, 344, 24, 8);
  sc.addInteractable({ id: 'body', x: 624, y: 358, r: 9, label: 'Examine: Mara Linden', action: () => {
    toast('Mara Linden. Eyes open, lashes white with frost. No blood. No struggle. Just... stillness.', 'thought');
    setFlag('examined_body'); journal('Examined the body: no visible wounds, no signs of a struggle.');
  } });

  // ---- Hidden boot trail (only visible in the flashlight beam)
  const { from, to, count } = BOOT_TRAIL; const ang = Math.atan2(to.y - from.y, to.x - from.x);
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1); const side = i % 2 ? 3 : -3;
    const x = from.x + (to.x - from.x) * t - Math.sin(ang) * side; const y = from.y + (to.y - from.y) * t + Math.cos(ang) * side;
    const img = sc.add.image(x, y, 'bootprint').setRotation(ang + Math.PI / 2).setDepth(DEPTH.DECAL).setAlpha(0);
    sc.hiddenDecals.push(img);
  }

  // ---- Trees
  const reserved: { x: number; y: number }[] = [
    ...NPC_SPOTS, ...CLUE_SPOTS, ...BATTERIES, ...LAMPS, ...PROPS, EXIT_ROAD, { x: 548, y: 740 },
  ].filter((p) => p.x < WORLD.width);
  const hit = (x: number, y: number, r: Rect, m: number) => x > r.x - m && x < r.x + r.w + m && y > r.y - m && y < r.y + r.h + m;
  const free = (x: number, y: number) => {
    if (BUILDINGS.some((b) => hit(x, y, { x: b.x, y: b.y - (b.extraTop ?? 0), w: b.w, h: b.h + (b.extraTop ?? 0) }, 14))) return false;
    if (ROADS.some((r) => hit(x, y, r, 8)) || hit(x, y, PLAZA, 10)) return false;
    if (hit(x, y, { x: 590, y: 480, w: 90, h: 140 }, 0)) return false;
    return !reserved.some((p) => Math.hypot(p.x - x, p.y - y) < 30);
  };
  const rand = new Phaser.Math.RandomDataGenerator(['hollowpine']);
  const placed: { x: number; y: number }[] = [];
  const plant = (x: number, y: number) => {
    if (!free(x, y) || placed.some((p) => Math.hypot(p.x - x, p.y - y) < 20)) return;
    placed.push({ x, y });
    const key = rand.pick(['tree-a', 'tree-a', 'tree-b', 'tree-c']);
    sc.add.image(x, y, key).setOrigin(0.5, 1).setDepth(y);
    sc.addWall(x - 3, y - 4, 6, 4);
  };
  for (let x = 10; x < WORLD.width; x += 18) { plant(x + rand.between(-4, 4), 26 + rand.between(0, 14)); plant(x + rand.between(-4, 4), WORLD.height - 4 - rand.between(0, 10)); }
  for (let y = 40; y < WORLD.height; y += 20) { plant(10 + rand.between(0, 12), y); plant(WORLD.width - 10 - rand.between(0, 12), y); }
  for (let i = 0; i < 500 && placed.length < 150; i++) plant(rand.between(20, WORLD.width - 20), rand.between(40, WORLD.height - 10));
  for (let i = 0; i < 12; i++) { const x = rand.between(30, WORLD.width - 30), y = rand.between(60, WORLD.height - 30); if (free(x, y)) sc.add.image(x, y, 'stump').setOrigin(0.5, 1).setDepth(y); }

  // ---- Exit road
  sc.addInteractable({ id: 'exit-road', x: EXIT_ROAD.x, y: EXIT_ROAD.y, r: 22, label: 'The road down the mountain', action: () => {
    if (!getState().flags.met_sheriff) { toast("Not yet. I came up here for a reason. The sheriff's waiting in the square.", 'thought'); return; }
    setState({ confirm: { title: 'Leave Hollowpine?', text: 'The last chained bus is idling at the switchback. If you board it, the case goes cold with the town.', action: 'leave' } });
    setMode('confirm');
  } });

  // ---- Interiors
  for (const a of Object.values(AREAS)) {
    if (!a.indoor) continue;
    const b = a.bounds;
    // Dark surround so the camera never shows the raw black void around the room.
    sc.add.rectangle(b.x - 500, b.y - 500, b.w + 1000, b.h + 1000, 0x060910).setOrigin(0).setDepth(DEPTH.GROUND - 1);
    sc.add.tileSprite(b.x, b.y, b.w, b.h, a.floor!).setOrigin(0).setDepth(DEPTH.GROUND);
    sc.add.tileSprite(b.x, b.y, b.w, 28, a.wall!).setOrigin(0).setDepth(b.y + 28);
    const dark = 0x07090f, gap = 14, cx = b.x + b.w / 2;
    sc.add.rectangle(b.x - 6, b.y - 4, b.w + 12, 4, 0x151822).setOrigin(0).setDepth(b.y + 28);
    sc.add.rectangle(b.x - 6, b.y, 6, b.h + 6, dark).setOrigin(0).setDepth(b.y + b.h + 20);
    sc.add.rectangle(b.x + b.w, b.y, 6, b.h + 6, dark).setOrigin(0).setDepth(b.y + b.h + 20);
    sc.add.rectangle(b.x - 6, b.y + b.h, b.w / 2 - gap + 6, 6, dark).setOrigin(0).setDepth(b.y + b.h + 20);
    sc.add.rectangle(cx + gap, b.y + b.h, b.w / 2 - gap + 6, 6, dark).setOrigin(0).setDepth(b.y + b.h + 20);
    sc.add.image(cx, b.y + b.h - 4, 'doormat').setDepth(DEPTH.DECAL);
    const walls: [number, number, number, number][] = [
      [b.x, b.y, b.w, 30], [b.x - 6, b.y, 6, b.h + 6], [b.x + b.w, b.y, 6, b.h + 6],
      [b.x - 6, b.y + b.h, b.w / 2 - gap + 6, 6], [cx + gap, b.y + b.h, b.w / 2 - gap + 6, 6], [cx - gap, b.y + b.h + 6, gap * 2, 6],
    ];
    walls.forEach(([x, y, w, h], i) => { sc.addWall(x, y, w, h); if (i < 5) L.addOccluder(x, y, w, h); });
    L.addLight({ x: cx, y: b.y + b.h + 4, radius: 40, intensity: 0.35, color: 0x6a8ad0 });
    sc.exits.push({ x1: cx - gap, x2: cx + gap, y: b.y + b.h - 3, to: 'town', tx: a.exit!.x, ty: a.exit!.y });
  }
  for (const f of FURNITURE) {
    const b = AREAS[f.area].bounds; const x = b.x + f.x, y = b.y + f.y;
    const img = sc.add.image(x, y, f.key).setOrigin(0);
    const w = img.width, h = img.height;
    img.setDepth(f.key === 'rug' ? DEPTH.DECAL : y + h);
    if (f.collide) sc.addWall(x + 1, y + h * 0.45, w - 2, h * 0.55);
    if (f.occlude) L.addOccluder(x + 1, y + h * 0.45, w - 2, h * 0.55);
    if (f.light) L.addLight({ x: x + f.light.dx, y: y + f.light.dy, radius: f.light.radius, intensity: f.light.intensity, color: f.light.color, flicker: f.light.flicker });
  }
  for (const l of AREA_LIGHTS) { const b = AREAS[l.area].bounds; L.addLight({ x: b.x + l.x, y: b.y + l.y, radius: l.radius, intensity: l.intensity, color: l.color, flicker: l.flicker }); }

  // ---- Clues
  for (const c of CLUE_SPOTS) {
    if (s.evidence.includes(c.id)) continue;
    const ev = EVIDENCE[c.id];
    const img = sc.add.image(c.x, c.y, `ev-${c.id}`).setScale(0.5).setDepth(c.y + 1);
    let glint: Phaser.GameObjects.Image | undefined;
    if (ev.hidden) img.setAlpha(0);
    else {
      glint = sc.add.image(c.x + 3, c.y - 4, 'glint').setDepth(DEPTH.GLINT).setAlpha(0);
      sc.tweens.add({ targets: glint, alpha: { from: 0, to: 0.9 }, duration: 380, yoyo: true, repeat: -1, repeatDelay: 2400 + Math.random() * 1800, delay: Math.random() * 2000 });
    }
    const it = sc.addInteractable({
      id: `clue-${c.id}`, x: c.x, y: c.y, r: 14, label: `Examine: ${c.label}`, hidden: ev.hidden, sprite: img,
      action: () => { it.active = false; img.destroy(); glint?.destroy(); sc.onEvidenceFound(c.id); },
    });
  }

  // ---- NPCs
  for (const n of NPC_SPOTS) {
    const spr = sc.add.sprite(n.x, n.y, `npc-${n.id}`).setOrigin(0.5, 1).setDepth(n.y);
    sc.tweens.add({ targets: spr, scaleY: 0.965, duration: 1300 + Math.random() * 500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    sc.addWall(n.x - 5, n.y - 5, 10, 5);
    const name = CHARACTERS[n.id].name;
    sc.addInteractable({ id: `npc-${n.id}`, x: n.x, y: n.y + 2, r: 26, label: `Talk to ${name}`, action: () => sc.startDialogue(n.id) });
    if (n.id === 'halvorsen') L.addLight({ x: n.x + 6, y: n.y - 6, radius: 30, intensity: 0.5, color: 0xffc070, flicker: 0.02 }); // his lantern
  }

  // ---- Batteries
  for (const bt of BATTERIES) {
    if (s.pickups.includes(bt.id)) continue;
    const img = sc.add.image(bt.x, bt.y, 'battery').setOrigin(0.5, 1).setDepth(bt.y);
    sc.tweens.add({ targets: img, y: bt.y - 2, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    const glint = sc.add.image(bt.x + 2, bt.y - 10, 'glint').setDepth(DEPTH.GLINT).setAlpha(0);
    sc.tweens.add({ targets: glint, alpha: { from: 0, to: 0.8 }, duration: 300, yoyo: true, repeat: -1, repeatDelay: 1800 + Math.random() * 1500 });
    const it = sc.addInteractable({ id: `bat-${bt.id}`, x: bt.x, y: bt.y, r: 14, label: 'Pick up battery', action: () => { it.active = false; img.destroy(); glint.destroy(); sc.onBattery(bt.id); } });
  }
}
