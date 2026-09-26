import Phaser from 'phaser';
import { AREAS, type AreaDef, type BuildingDef, type FurnitureDef } from '../data/areas';
import { drawDetective, drawPerson, LOOKS, makeCanvas, rng, type Ctx, PAL } from './pixelArt';

/**
 * Every texture in FROST VEIL is generated procedurally at boot. No binary assets are shipped,
 * which keeps the repo tiny and lets the palette be tuned from code. See ASSET_PLAN.md for the
 * hand-authored replacement plan.
 */
type Scene = Phaser.Scene;

function put(scene: Scene, key: string, c: HTMLCanvasElement) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  scene.textures.addCanvas(key, c);
}
function putSheet(scene: Scene, key: string, c: HTMLCanvasElement, fw: number, fh: number, n: number) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.addCanvas(key, c);
  if (!tex) return;
  for (let i = 0; i < n; i++) tex.add(i, 0, i * fw, 0, fw, fh);
}
const R = (g: Ctx, x: number, y: number, w: number, h: number, c: string) => { g.fillStyle = c; g.fillRect(x, y, w, h); };

// ------------------------------------------------------------------ characters
function characters(scene: Scene) {
  const { c, g } = makeCanvas(16 * 9, 20);
  const dirs = ['down', 'up', 'side'] as const;
  dirs.forEach((d, di) => { for (let s = 0; s < 3; s++) drawDetective(g, (di * 3 + s) * 16, 0, d, s); });
  putSheet(scene, 'detective', c, 16, 20, 9);
  for (const [id, look] of Object.entries(LOOKS)) {
    const { c: nc, g: ng } = makeCanvas(32, 20);
    drawPerson(ng, 0, 0, look, 0); drawPerson(ng, 16, 0, look, 1);
    putSheet(scene, `npc_${id}`, nc, 16, 20, 2);
  }
}

// ------------------------------------------------------------------ small props
function props(scene: Scene) {
  let k = makeCanvas(2, 2); R(k.g, 0, 0, 2, 2, '#f4f8ff'); put(scene, 'flake', k.c);
  k = makeCanvas(3, 3); R(k.g, 1, 0, 1, 3, '#ffffff'); R(k.g, 0, 1, 3, 1, '#ffffff'); put(scene, 'flake_big', k.c);
  k = makeCanvas(3, 4); R(k.g, 0, 0, 3, 3, 'rgba(90,110,140,0.55)'); R(k.g, 1, 3, 1, 1, 'rgba(90,110,140,0.4)'); put(scene, 'footprint', k.c);

  k = makeCanvas(7, 7);
  R(k.g, 3, 0, 1, 7, '#dff6ff'); R(k.g, 0, 3, 7, 1, '#dff6ff'); R(k.g, 2, 2, 3, 3, '#ffffff'); R(k.g, 3, 3, 1, 1, '#9fe7ff');
  put(scene, 'sparkle', k.c);

  k = makeCanvas(6, 10);
  R(k.g, 2, 0, 2, 1, '#d19a44'); R(k.g, 0, 1, 6, 9, '#2f3440'); R(k.g, 1, 1, 1, 9, '#474e5e');
  R(k.g, 0, 4, 6, 2, '#7fd1ff'); R(k.g, 1, 4, 1, 2, '#c8f0ff'); R(k.g, 0, 9, 6, 1, '#1b1e26');
  put(scene, 'battery', k.c);

  // street lamp
  k = makeCanvas(10, 44);
  R(k.g, 4, 9, 2, 33, '#1b1e26'); R(k.g, 5, 9, 1, 33, '#2c313d'); R(k.g, 2, 41, 6, 3, '#15171d'); R(k.g, 2, 40, 6, 1, PAL.snow);
  R(k.g, 1, 1, 8, 2, '#111318'); R(k.g, 0, 0, 10, 1, PAL.snowLight); R(k.g, 2, 3, 6, 6, '#ffcf7a'); R(k.g, 3, 4, 4, 4, '#fff1c4');
  R(k.g, 2, 3, 1, 6, '#15171d'); R(k.g, 7, 3, 1, 6, '#15171d'); R(k.g, 2, 8, 6, 1, '#15171d');
  put(scene, 'lamp', k.c);

  // pine
  k = makeCanvas(24, 40);
  {
    const g = k.g; R(g, 10, 33, 4, 7, '#3b2a1f');
    const layers = [[20, 8], [26, 12], [32, 16]];
    const cols = ['#173129', '#1d3b33', '#23473d'];
    layers.forEach(([bottom, half], i) => {
      for (let y = 0; y < 14; y++) {
        const w = Math.round((half * (y + 1)) / 14);
        R(g, 12 - w, bottom - 14 + y + i * 1, w * 2, 1, cols[i]);
        if (y < 3 || (y % 5 === 0)) R(g, 12 - w, bottom - 14 + y + i, Math.max(1, Math.round(w * 0.9)), 1, y < 3 ? '#dfe9f5' : '#b8c9dc');
      }
    });
    R(g, 11, 2, 2, 2, '#eef4fb'); R(g, 3, 34, 18, 2, 'rgba(0,0,0,0.18)');
  }
  put(scene, 'pine', k.c);

  // fountain
  k = makeCanvas(56, 44);
  {
    const g = k.g;
    R(g, 2, 22, 52, 18, '#5d6573'); R(g, 4, 20, 48, 4, '#7c8594'); R(g, 6, 24, 44, 10, '#a9c6de'); R(g, 8, 26, 40, 6, '#c9e0f2');
    R(g, 10, 27, 12, 1, '#eef7ff'); R(g, 30, 29, 10, 1, '#eef7ff');
    R(g, 24, 4, 8, 22, '#6e7787'); R(g, 25, 4, 2, 22, '#8a93a3'); R(g, 20, 2, 16, 4, '#7c8594'); R(g, 19, 0, 18, 2, PAL.snowLight);
    for (let i = 0; i < 6; i++) R(g, 21 + i * 3, 6, 1, 2 + (i % 3) * 2, '#cfe8ff');
    R(g, 2, 38, 52, 2, '#3f4552'); R(g, 3, 20, 50, 1, PAL.snowLight);
    for (let i = 0; i < 12; i++) R(g, 4 + i * 4, 34, 1, 2 + (i % 2) * 2, '#cfe8ff');
    R(g, 0, 40, 56, 4, 'rgba(0,0,0,0.2)');
  }
  put(scene, 'fountain', k.c);

  // body lying in the snow
  k = makeCanvas(24, 12);
  {
    const g = k.g;
    R(g, 1, 9, 22, 3, 'rgba(0,0,0,0.25)'); R(g, 4, 3, 14, 6, '#3f4c63'); R(g, 5, 4, 12, 1, '#56647d'); R(g, 4, 8, 14, 1, '#2c3647');
    R(g, 18, 3, 4, 5, '#d8e0e8'); R(g, 19, 2, 3, 2, '#6b4b3a'); R(g, 20, 4, 1, 1, '#556');
    R(g, 1, 5, 3, 2, '#1c1e28'); R(g, 10, 1, 2, 2, '#d8e0e8'); R(g, 10, 9, 2, 2, '#d8e0e8');
    R(g, 16, 3, 2, 5, '#94292f');
    for (let i = 0; i < 9; i++) R(g, 4 + ((i * 7) % 16), 3 + ((i * 3) % 6), 1, 1, '#eef4fb');
  }
  put(scene, 'clue_body', k.c);

  k = makeCanvas(12, 7); R(k.g, 0, 2, 12, 3, '#3d6fb8'); R(k.g, 0, 2, 12, 1, '#5b8fd8'); R(k.g, 8, 0, 3, 7, '#3d6fb8');
  for (let i = 0; i < 4; i++) R(k.g, i * 3, 5, 1, 2, '#2c528c'); put(scene, 'clue_scarf', k.c);

  k = makeCanvas(8, 10);
  R(k.g, 0, 0, 3, 5, '#8093ad'); R(k.g, 0, 6, 3, 2, '#8093ad'); R(k.g, 0, 1, 3, 1, '#667a95'); R(k.g, 0, 3, 3, 1, '#667a95');
  R(k.g, 5, 2, 3, 5, '#8093ad'); R(k.g, 5, 8, 3, 2, '#8093ad'); R(k.g, 5, 3, 3, 1, '#667a95'); R(k.g, 5, 5, 3, 1, '#667a95');
  put(scene, 'prints', k.c);

  k = makeCanvas(5, 9); R(k.g, 1, 0, 3, 2, '#8b5a2b'); R(k.g, 0, 2, 5, 7, '#9fd0e8'); R(k.g, 1, 3, 1, 5, '#e6f7ff'); R(k.g, 0, 6, 5, 1, '#e8e3d0');
  put(scene, 'clue_vial', k.c);
  k = makeCanvas(12, 9); R(k.g, 0, 0, 12, 9, '#6b2f24'); R(k.g, 1, 1, 10, 7, '#e9dfc4'); R(k.g, 6, 0, 1, 9, '#4a1e17');
  R(k.g, 2, 3, 3, 1, '#9b8c70'); R(k.g, 7, 3, 3, 1, '#c33'); R(k.g, 2, 5, 3, 1, '#9b8c70'); put(scene, 'clue_ledger', k.c);
  k = makeCanvas(12, 7); R(k.g, 0, 3, 12, 4, '#4c4a4e'); R(k.g, 2, 2, 8, 2, '#6b686e'); R(k.g, 3, 1, 5, 3, '#d9cfb4'); R(k.g, 3, 1, 5, 1, '#e07a2a'); R(k.g, 7, 2, 1, 2, '#e07a2a');
  put(scene, 'clue_letter', k.c);
  k = makeCanvas(12, 9); R(k.g, 0, 0, 12, 9, '#1b1b22'); R(k.g, 1, 1, 10, 7, '#2b2b36'); R(k.g, 8, 0, 1, 9, '#a3262b'); R(k.g, 3, 3, 4, 1, '#c9b67a');
  put(scene, 'clue_log', k.c);

  // frozen van
  k = makeCanvas(40, 26);
  {
    const g = k.g;
    R(g, 2, 22, 36, 4, 'rgba(0,0,0,0.25)'); R(g, 2, 8, 36, 14, '#7a2f2f'); R(g, 4, 4, 22, 6, '#6a2828'); R(g, 6, 5, 8, 4, '#8fb3d1'); R(g, 16, 5, 8, 4, '#8fb3d1');
    R(g, 1, 3, 30, 3, PAL.snowLight); R(g, 26, 7, 12, 2, PAL.snowLight); R(g, 0, 16, 40, 6, PAL.snow); R(g, 3, 20, 6, 3, '#1a1a1f'); R(g, 30, 20, 6, 3, '#1a1a1f');
    R(g, 20, 11, 10, 3, '#d9c48a'); R(g, 34, 10, 3, 2, '#ffe9a8');
  }
  put(scene, 'car', k.c);

  k = makeCanvas(16, 20);
  R(k.g, 7, 8, 2, 12, '#3b2a1f'); R(k.g, 0, 1, 16, 9, '#5a4030'); R(k.g, 1, 2, 14, 7, '#6e503c'); R(k.g, 0, 0, 16, 2, PAL.snowLight);
  R(k.g, 3, 4, 10, 1, '#d9cfb4'); R(k.g, 3, 6, 7, 1, '#d9cfb4'); put(scene, 'sign', k.c);

  // radial glow + fog + vignette
  k = makeCanvas(64, 64);
  { const gr = k.g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,190,110,0.9)'); gr.addColorStop(1, 'rgba(255,140,60,0)'); k.g.fillStyle = gr; k.g.fillRect(0, 0, 64, 64); }
  put(scene, 'glow', k.c);

  k = makeCanvas(256, 256);
  {
    const r = rng(99); const g = k.g;
    for (let i = 0; i < 70; i++) {
      const x = r() * 256, y = r() * 256, rad = 20 + r() * 50;
      for (const [ox, oy] of [[0, 0], [256, 0], [-256, 0], [0, 256], [0, -256]]) {
        const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, rad);
        gr.addColorStop(0, `rgba(190,205,230,${0.10 + r() * 0.1})`); gr.addColorStop(1, 'rgba(190,205,230,0)');
        g.fillStyle = gr; g.fillRect(x + ox - rad, y + oy - rad, rad * 2, rad * 2);
      }
    }
  }
  put(scene, 'fog', k.c);

  k = makeCanvas(480, 270);
  { const gr = k.g.createRadialGradient(240, 135, 90, 240, 135, 290); gr.addColorStop(0, 'rgba(0,0,8,0)'); gr.addColorStop(1, 'rgba(0,0,8,0.75)'); k.g.fillStyle = gr; k.g.fillRect(0, 0, 480, 270); }
  put(scene, 'vignette', k.c);
}

// ------------------------------------------------------------------ buildings
function drawWindow(g: Ctx, x: number, y: number, lit: boolean, boarded: boolean, stained = false) {
  R(g, x - 1, y - 1, 12, 15, '#241a15');
  if (stained) {
    const cols = ['#d9a441', '#8e2c3a', '#2d5d8e', '#3f7a4a'];
    for (let i = 0; i < 4; i++) R(g, x + (i % 2) * 5, y + Math.floor(i / 2) * 6, 5, 6, cols[i]);
    R(g, x, y, 10, 2, '#241a15'); R(g, x + 2, y - 1, 6, 1, '#241a15');
  } else if (lit) {
    R(g, x, y, 10, 13, '#ffab4a'); R(g, x + 2, y + 2, 6, 8, '#ffd78e'); R(g, x + 3, y + 3, 3, 3, '#fff0c8');
  } else {
    R(g, x, y, 10, 13, '#18202e'); R(g, x + 1, y + 1, 2, 5, '#2b3a52');
  }
  R(g, x + 4, y, 2, 13, '#241a15'); R(g, x, y + 6, 10, 1, '#241a15');
  if (boarded) { R(g, x - 2, y + 2, 14, 2, '#6b5038'); R(g, x - 2, y + 8, 14, 2, '#5a4230'); }
  R(g, x - 2, y + 13, 14, 2, PAL.snowLight);
}

function snowCap(g: Ctx, x: number, y: number, w: number, r: () => number, depth = 7) {
  R(g, x, y, w, depth, PAL.snowLight); R(g, x, y + depth - 2, w, 2, PAL.snow);
  for (let i = 0; i < w; i += 2) { const d = Math.floor(r() * 4); R(g, x + i, y + depth, 2, d, PAL.snow); }
}
function icicles(g: Ctx, x: number, y: number, w: number, r: () => number) {
  for (let i = 1; i < w - 1; i += 2 + Math.floor(r() * 3)) { const l = 2 + Math.floor(r() * 6); R(g, x + i, y, 1, l, '#bcd6ee'); R(g, x + i, y, 1, 1, '#eef7ff'); }
}

function building(b: BuildingDef) {
  const { c, g } = makeCanvas(b.w, b.h);
  const r = rng(b.x * 7 + b.y);
  const church = b.style === 'church';
  const roofTop = church ? 120 : 8;
  const wallTop = church ? 160 : Math.floor(b.h * 0.5);

  if (church) {
    const tx = Math.floor(b.w / 2) - 22;
    R(g, tx, 34, 44, 130, '#5d6170'); R(g, tx, 34, 3, 130, '#4a4d5a'); R(g, tx + 41, 34, 3, 130, '#4a4d5a');
    for (let y = 40; y < 160; y += 6) R(g, tx + 3, y, 38, 1, '#525663');
    for (let i = 0; i < 30; i++) { const w = Math.round((i / 30) * 26); R(g, tx + 22 - w, 6 + i, w * 2, 1, b.roof); }
    for (let i = 0; i < 10; i++) { const w = Math.round((i / 30) * 26); R(g, tx + 22 - w, 6 + i, w * 2, 1, PAL.snowLight); }
    R(g, tx + 21, 0, 2, 8, '#c9b67a'); R(g, tx + 18, 2, 8, 2, '#c9b67a');
    R(g, tx + 14, 50, 16, 22, '#0c0e14'); R(g, tx + 16, 48, 12, 2, '#0c0e14'); R(g, tx + 18, 56, 8, 10, '#2a2c35');
    R(g, tx + 19, 58, 6, 8, '#6f5a2a'); R(g, tx + 20, 60, 4, 2, '#8a7236');
    R(g, tx + 12, 72, 20, 2, PAL.snowLight); icicles(g, tx + 12, 74, 20, r);
    R(g, tx + 17, 90, 10, 16, '#241a15'); R(g, tx + 18, 91, 8, 14, '#d9a441'); R(g, tx + 21, 91, 2, 14, '#241a15'); R(g, tx + 18, 96, 8, 2, '#241a15');
  }

  // roof slab
  R(g, 0, roofTop, b.w, wallTop - roofTop, b.roof);
  for (let y = roofTop + 4; y < wallTop; y += 5) {
    R(g, 0, y, b.w, 1, 'rgba(0,0,0,0.25)');
    for (let x = (y % 10 === 0 ? 0 : 6); x < b.w; x += 12) R(g, x, y - 4, 1, 4, 'rgba(0,0,0,0.18)');
  }
  snowCap(g, 0, roofTop, b.w, r, church ? 12 : Math.floor((wallTop - roofTop) * 0.55));
  if (b.style === 'inn') { R(g, b.w - 40, roofTop - 8, 12, 20, '#3a2f2c'); R(g, b.w - 41, roofTop - 9, 14, 3, PAL.snowLight); }
  if (b.style === 'post') { R(g, 16, roofTop - 6, 10, 16, '#3a3437'); R(g, 15, roofTop - 7, 12, 3, PAL.snowLight); }

  // walls
  R(g, 0, wallTop, b.w, b.h - wallTop, b.wall);
  const plank = b.style === 'clinic' || b.style === 'church' ? 6 : 4;
  for (let y = wallTop + 2; y < b.h; y += plank) R(g, 0, y, b.w, 1, 'rgba(0,0,0,0.22)');
  if (b.style === 'church' || b.style === 'clinic') for (let y = wallTop; y < b.h; y += plank) for (let x = ((y / plank) % 2) * 8; x < b.w; x += 16) R(g, x, y, 1, plank, 'rgba(0,0,0,0.18)');
  R(g, 0, wallTop, b.w, 3, 'rgba(0,0,0,0.45)');
  icicles(g, 0, wallTop, b.w, r);
  R(g, 0, 0 + wallTop, 2, b.h - wallTop, 'rgba(0,0,0,0.3)'); R(g, b.w - 2, wallTop, 2, b.h - wallTop, 'rgba(0,0,0,0.3)');

  for (const w of b.windows) drawWindow(g, w.x, w.y, w.lit, b.style === 'abandoned', church);

  // door
  const dx = b.door.x, dw = b.door.w, dh = 20, dy = b.h - dh;
  if (b.style === 'garage') {
    R(g, 20, b.h - 44, 70, 44, '#2b2b30');
    for (let y = b.h - 42; y < b.h; y += 4) R(g, 22, y, 66, 2, '#44454d');
    R(g, 18, b.h - 46, 74, 2, PAL.snowLight);
  }
  R(g, dx - 2, dy - 2, dw + 4, dh + 2, '#1d140f'); R(g, dx, dy, dw, dh, b.style === 'clinic' ? '#e2e6ea' : '#3e2819');
  R(g, dx + 1, dy + 1, dw - 2, 1, 'rgba(255,255,255,0.08)'); R(g, dx + dw - 4, dy + 10, 2, 2, '#c9a64a');
  if (b.style === 'clinic') { R(g, dx + 5, dy + 4, 4, 10, '#b3272d'); R(g, dx + 2, dy + 7, 10, 4, '#b3272d'); }
  if (b.style === 'abandoned') { R(g, dx - 3, dy + 4, dw + 6, 2, '#6b5038'); R(g, dx - 3, dy + 12, dw + 6, 2, '#6b5038'); }
  R(g, dx - 3, dy - 3, dw + 6, 2, PAL.snowLight);

  // hanging signboards
  const sign = (x: number, y: number, col: string, mark: string) => {
    R(g, x + 3, y - 4, 1, 4, '#15171d'); R(g, x + 13, y - 4, 1, 4, '#15171d'); R(g, x, y, 18, 10, '#2a1c14'); R(g, x + 1, y + 1, 16, 8, col);
    g.fillStyle = '#f0e2b8'; g.font = '8px monospace'; g.fillText(mark, x + 5, y + 8); R(g, x, y - 1, 18, 1, PAL.snowLight);
  };
  if (b.style === 'inn') sign(dx + 22, dy - 16, '#7a3a24', 'L');
  if (b.style === 'post') sign(dx + 20, dy - 16, '#2d4a7a', 'P');
  if (b.style === 'garage') sign(dx + 22, dy - 16, '#7a5a24', 'R');

  // snow drift at the base
  for (let x = 0; x < b.w; x += 3) R(g, x, b.h - 1 - Math.floor(r() * 3), 3, 3, PAL.snow);
  return c;
}

// ------------------------------------------------------------------ ground
function speckle(g: Ctx, x0: number, y0: number, w: number, h: number, r: () => number, cols: string[], density: number) {
  const n = Math.floor((w * h) / density);
  for (let i = 0; i < n; i++) { g.fillStyle = cols[Math.floor(r() * cols.length)]; g.fillRect(x0 + Math.floor(r() * w), y0 + Math.floor(r() * h), 1 + Math.floor(r() * 2), 1); }
}

function townGround(a: AreaDef) {
  const { w, h } = a.bounds;
  const { c, g } = makeCanvas(w, h);
  const r = rng(4242);
  R(g, 0, 0, w, h, PAL.snow);
  for (let i = 0; i < 160; i++) {
    const x = r() * w, y = r() * h, rx = 20 + r() * 70, ry = 8 + r() * 20;
    g.fillStyle = r() > 0.5 ? 'rgba(255,255,255,0.22)' : 'rgba(110,130,165,0.10)';
    g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill();
  }
  speckle(g, 0, 0, w, h, r, ['#c4d1e3', '#e3ebf6', '#b9c8dc', '#f2f6fb'], 14);
  for (const p of a.plazas) {
    R(g, p.x, p.y, p.w, p.h, '#bac6d6');
    for (let y = p.y; y < p.y + p.h; y += 8) for (let x = p.x + ((y / 8) % 2) * 5; x < p.x + p.w; x += 10) R(g, x, y, 9, 7, r() > 0.35 ? '#c7d2e0' : '#a9b6c8');
    for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(230,238,248,0.8)'; g.beginPath(); g.ellipse(p.x + r() * p.w, p.y + r() * p.h, 10 + r() * 30, 4 + r() * 8, 0, 0, Math.PI * 2); g.fill(); }
  }
  for (const p of a.paths) { R(g, p.x, p.y, p.w, p.h, '#b3c1d4'); speckle(g, p.x, p.y, p.w, p.h, r, ['#a4b3c8', '#c3cfe0'], 6); }
  for (const rd of a.roads) {
    R(g, rd.x, rd.y, rd.w, rd.h, PAL.ice);
    const horiz = rd.w > rd.h;
    for (let i = 0; i < (rd.w * rd.h) / 90; i++) {
      const x = rd.x + r() * rd.w, y = rd.y + r() * rd.h;
      g.fillStyle = r() > 0.5 ? PAL.iceLight : '#56697f';
      if (horiz) g.fillRect(x, y, 4 + r() * 16, 1); else g.fillRect(x, y, 1, 4 + r() * 16);
    }
    if (horiz) { R(g, rd.x, rd.y + 16, rd.w, 2, PAL.iceDark); R(g, rd.x, rd.y + 38, rd.w, 2, PAL.iceDark); }
    else { R(g, rd.x + 14, rd.y, 2, rd.h, PAL.iceDark); R(g, rd.x + 38, rd.y, 2, rd.h, PAL.iceDark); }
    for (let i = 0; i < (horiz ? rd.w : rd.h); i += 3) {
      const d = 2 + Math.floor(r() * 4);
      if (horiz) { R(g, rd.x + i, rd.y, 3, d, PAL.snowShade); R(g, rd.x + i, rd.y + rd.h - d, 3, d, PAL.snowShade); }
      else { R(g, rd.x, rd.y + i, d, 3, PAL.snowShade); R(g, rd.x + rd.w - d, rd.y + i, d, 3, PAL.snowShade); }
    }
  }
  // building shadows (soft)
  for (const b of a.buildings) { g.fillStyle = 'rgba(40,55,85,0.25)'; g.fillRect(b.x + 4, b.y + b.h, b.w, 5); }
  return c;
}

function furniture(g: Ctx, f: FurnitureDef, ox: number, oy: number, r: () => number) {
  const x = f.x - ox, y = f.y - oy, w = f.w, h = f.h;
  const shadow = () => R(g, x + 2, y + h, w, 3, 'rgba(0,0,0,0.3)');
  switch (f.type) {
    case 'bar':
      shadow(); R(g, x, y, w, h, '#3e2717'); R(g, x, y, w, 5, '#7a5234'); R(g, x, y + 5, w, 1, '#2a190e');
      for (let i = 6; i < w; i += 12) R(g, x + i, y + 7, 1, h - 8, '#2a190e');
      break;
    case 'shelf':
      R(g, x, y, w, h, '#3a2618');
      for (let i = 2; i < w - 2; i += 4) R(g, x + i, y + 2, 2, h - 4, ['#3f7a4a', '#8e2c3a', '#c9a64a', '#2d5d8e', '#d9d2bf'][Math.floor(r() * 5)]);
      break;
    case 'table':
      shadow(); R(g, x, y, w, h, '#5c3d27'); R(g, x + 1, y + 1, w - 2, 3, '#7a5537');
      R(g, x - 6, y + 4, 5, 6, '#4a3020'); R(g, x + w + 1, y + 4, 5, 6, '#4a3020');
      R(g, x + 6, y + 5, 3, 3, '#d9e6ee'); R(g, x + 16, y + 6, 3, 3, '#c98b3a');
      break;
    case 'fireplace':
      R(g, x - 4, y - 18, w + 8, h + 18, '#4d525e'); for (let i = 0; i < 6; i++) R(g, x - 4, y - 18 + i * 6, w + 8, 1, '#3a3e48');
      R(g, x + 8, y - 4, w - 16, h + 4, '#120c0a'); R(g, x + 12, y + 4, w - 24, 6, '#ff8a2a'); R(g, x + 16, y + 2, w - 32, 4, '#ffd36a');
      break;
    case 'stove':
      shadow(); R(g, x, y, w, h, '#1f2228'); R(g, x + 2, y + 2, w - 4, 3, '#353a44'); R(g, x + 6, y + 10, w - 12, 6, '#ff7a2a'); R(g, x + 8, y + 12, w - 16, 2, '#ffd06a');
      R(g, x + w / 2 - 2, y - 14, 4, 14, '#1a1c21');
      break;
    case 'desk':
      shadow(); R(g, x, y, w, h, '#5a3f2a'); R(g, x + 1, y + 1, w - 2, 3, '#77563a'); R(g, x + 6, y + 4, 10, 7, '#e9dfc4'); R(g, x + 20, y + 5, 8, 6, '#dcd2b6'); R(g, x + 32, y + 3, 2, 8, '#222');
      break;
    case 'counter':
      shadow(); R(g, x, y, w, h, '#4d3524'); R(g, x, y, w, 4, '#6b4a30'); R(g, x + 20, y - 3, 10, 4, '#c9b67a'); R(g, x + 70, y - 2, 14, 3, '#e9dfc4');
      break;
    case 'crate':
      shadow(); R(g, x, y, w, h, '#7a5a3a'); R(g, x, y, w, 2, '#9a7650'); R(g, x + 1, y + h / 2, w - 2, 1, '#5a4028'); R(g, x + w / 2, y, 1, h, '#5a4028');
      break;
    case 'pew':
      shadow(); R(g, x, y, w, h, '#3b2a1e'); R(g, x, y, w, 3, '#57402d'); R(g, x, y + h - 2, w, 2, '#2a1d14');
      break;
    case 'altar':
      shadow(); R(g, x, y, w, h, '#e7e2d6'); R(g, x, y + h - 3, w, 3, '#c9b67a'); R(g, x + w / 2 - 1, y + 2, 2, 8, '#8a2c34');
      for (let i = 0; i < 6; i++) { R(g, x + 6 + i * 9, y + 4, 2, 5, '#f4efe1'); R(g, x + 6 + i * 9, y + 2, 2, 2, '#ffb45a'); }
      break;
    case 'lectern':
      shadow(); R(g, x, y, w, h, '#4b3322'); R(g, x - 2, y, w + 4, 3, '#6b4a30');
      break;
    case 'cabinet':
      shadow(); R(g, x, y - 12, w, h + 12, '#c9d3dc'); R(g, x + 1, y - 11, w - 2, 10, '#9fb8cc'); R(g, x + w / 2, y - 12, 1, h + 12, '#8a96a2');
      for (let i = 0; i < 5; i++) R(g, x + 3 + i * 8, y - 9, 3, 6, ['#d9a441', '#6fa86a', '#b34a4a', '#e6e6e6'][i % 4]);
      R(g, x + w / 2 - 3, y + 6, 2, 2, '#555'); R(g, x + w / 2 + 2, y + 6, 2, 2, '#555');
      break;
    case 'bed':
      shadow(); R(g, x, y, w, h, '#8a96a2'); R(g, x + 2, y + 2, w - 4, h - 4, '#e3e9ef'); R(g, x + 2, y + 2, 12, h - 4, '#f7f9fb'); R(g, x + 20, y + 2, w - 22, h - 4, '#6f8aa6');
      break;
    case 'plow':
      shadow(); R(g, x + 16, y + 4, w - 20, h - 12, '#d9772b'); R(g, x + 20, y + 8, 28, 14, '#8fb3d1'); R(g, x + 16, y + 4, w - 20, 3, '#f09a4a');
      R(g, x, y + 10, 14, h - 16, '#8a8f99'); R(g, x, y + 10, 14, 3, '#eef4fb'); R(g, x + 22, y + h - 10, 12, 10, '#15161a'); R(g, x + w - 18, y + h - 10, 12, 10, '#15161a');
      R(g, x + 60, y + 10, 18, 3, '#f0d24a');
      break;
    case 'bench':
      shadow(); R(g, x, y, w, h, '#6b5236'); R(g, x, y, w, 3, '#86684a'); R(g, x + 6, y - 6, 3, 7, '#9aa3ae'); R(g, x + 20, y - 4, 12, 3, '#9aa3ae'); R(g, x + 44, y - 8, 2, 9, '#c33');
      break;
    default:
      R(g, x, y, w, h, '#444');
  }
}

function interiorGround(a: AreaDef) {
  const { x: ox, y: oy, w, h } = a.bounds;
  const { c, g } = makeCanvas(w, h);
  const r = rng(ox + oy * 3);
  const floor = a.floor ?? '#4a3527';
  R(g, 0, 0, w, h, floor);
  if (a.id === 'clinic') {
    for (let y = 32; y < h; y += 12) for (let x = ((y / 12) % 2) * 6; x < w; x += 12) R(g, x, y, 11, 11, r() > 0.5 ? '#66707c' : '#5b6470');
  } else if (a.id === 'church' || a.id === 'garage') {
    for (let y = 32; y < h; y += 16) for (let x = ((y / 16) % 2) * 10; x < w; x += 20) { R(g, x, y, 19, 15, a.id === 'church' ? (r() > 0.5 ? '#40404b' : '#373742') : (r() > 0.5 ? '#3f4046' : '#35363c')); }
    if (a.id === 'church') R(g, w / 2 - 16, 60, 32, h - 68, '#6b2229');
    if (a.id === 'garage') for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(10,10,14,0.45)'; g.beginPath(); g.ellipse(40 + r() * 240, 80 + r() * 120, 6 + r() * 12, 3 + r() * 5, 0, 0, Math.PI * 2); g.fill(); }
  } else {
    for (let y = 32; y < h; y += 6) {
      R(g, 0, y, w, 1, 'rgba(0,0,0,0.3)');
      for (let x = Math.floor(r() * 30); x < w; x += 24 + Math.floor(r() * 30)) R(g, x, y, 1, 6, 'rgba(0,0,0,0.25)');
    }
    speckle(g, 0, 32, w, h - 32, r, ['rgba(255,255,255,0.05)', 'rgba(0,0,0,0.15)'], 20);
  }
  if (a.id === 'inn') { R(g, 150, 120, 80, 50, '#5a2328'); R(g, 153, 123, 74, 44, '#7a2f33'); for (let i = 0; i < 74; i += 6) R(g, 153 + i, 123, 3, 44, 'rgba(0,0,0,0.12)'); }

  // back wall
  const wall = a.wall ?? '#3d2f36';
  R(g, 0, 0, w, 32, wall);
  for (let x = 0; x < w; x += 8) R(g, x, 0, 1, 28, 'rgba(0,0,0,0.18)');
  R(g, 0, 26, w, 3, 'rgba(0,0,0,0.35)'); R(g, 0, 29, w, 3, '#1a1418');
  const wins = a.id === 'church' ? [60, 240] : [140, 250];
  for (const wx of wins) {
    R(g, wx - 1, 5, 20, 18, '#1d1612'); R(g, wx, 6, 18, 16, '#1b2c48');
    for (let i = 0; i < 10; i++) R(g, wx + Math.floor(r() * 18), 6 + Math.floor(r() * 16), 1, 1, '#dfe9f5');
    R(g, wx, 18, 18, 4, '#cfdcec'); R(g, wx + 8, 6, 1, 16, '#1d1612'); R(g, wx, 13, 18, 1, '#1d1612');
  }
  R(g, 0, 0, 8, h, '#15111a'); R(g, w - 8, 0, 8, h, '#15111a'); R(g, 0, h - 8, w, 8, '#15111a');
  R(g, w / 2 - 14, h - 8, 28, 8, '#0a0c12'); R(g, w / 2 - 12, h - 16, 24, 7, '#5a2a2a'); R(g, w / 2 - 12, h - 16, 24, 1, '#7a3a3a');
  // snow blown in under the door
  for (let i = 0; i < 20; i++) R(g, w / 2 - 12 + Math.floor(r() * 24), h - 10 - Math.floor(r() * 10), 1, 1, '#dfe9f5');
  for (const f of a.furniture) furniture(g, f, ox, oy, r);
  return c;
}

function titleBackdrop() {
  const W = 480, H = 270;
  const { c, g } = makeCanvas(W, H);
  const r = rng(2026);
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#02040a'); sky.addColorStop(0.55, '#0a1830'); sky.addColorStop(1, '#1b2e4c');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 60; i++) R(g, Math.floor(r() * W), Math.floor(r() * 120), 1, 1, `rgba(220,230,255,${0.2 + r() * 0.5})`);
  const ridge = (base: number, amp: number, col: string, cap: string | null, seed: number) => {
    const rr = rng(seed); let y = base;
    for (let x = 0; x < W; x++) {
      y += (rr() - 0.5) * amp; y = Math.max(base - 60, Math.min(base + 20, y));
      R(g, x, Math.floor(y), 1, H - Math.floor(y), col);
      if (cap) R(g, x, Math.floor(y), 1, 3 + Math.floor(rr() * 3), cap);
    }
  };
  ridge(150, 5, '#0f1c33', '#3e5577', 5); ridge(185, 4, '#0b1526', '#2b3d5a', 9);
  for (let i = 0; i < 16; i++) {
    const hx = 40 + i * 26 + Math.floor(r() * 10), hw = 14 + Math.floor(r() * 10), hh = 10 + Math.floor(r() * 14), hy = 222 - hh;
    R(g, hx, hy, hw, hh + 10, '#070b14'); R(g, hx - 1, hy - 2, hw + 2, 2, '#9fb3cf');
    if (r() > 0.3) R(g, hx + 3, hy + 4, 2, 3, '#ffb45a');
    if (r() > 0.6) R(g, hx + hw - 5, hy + 4, 2, 3, '#ffb45a');
  }
  R(g, 220, 150, 10, 80, '#070b14'); for (let i = 0; i < 12; i++) R(g, 225 - i / 2, 138 + i, i, 1, '#070b14'); R(g, 224, 132, 2, 7, '#070b14');
  R(g, 0, 228, W, 42, '#16233a'); speckle(g, 0, 228, W, 42, r, ['#22324d', '#0f1a2c'], 10);
  return c;
}

export function generateAllTextures(scene: Scene) {
  characters(scene);
  props(scene);
  for (const a of Object.values(AREAS)) {
    put(scene, `ground_${a.id}`, a.interior ? interiorGround(a) : townGround(a));
    for (const b of a.buildings) put(scene, `bld_${b.id}`, building(b));
  }
  put(scene, 'title_bg', titleBackdrop());
}
