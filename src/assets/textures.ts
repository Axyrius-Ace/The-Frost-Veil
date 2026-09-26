import Phaser from 'phaser';
import { WORLD, ROADS, PLAZA, ICE, BUILDINGS, BuildingDef } from '../data/world';
import { PALETTES, CharPal } from './palettes';
import { EVIDENCE_IDS } from '../data/evidence';
import { ICONS } from './icons';

/**
 * Procedural pixel-art generator. Every sprite in FROST VEIL is painted here at boot,
 * so the game ships with zero binary assets. See docs/ASSET_PLAN.md for how to swap in
 * hand-drawn PNGs using the same texture keys.
 */
type Ctx = CanvasRenderingContext2D;
type Dir = 'down' | 'left' | 'right' | 'up';
const DIRS: Dir[] = ['down', 'left', 'right', 'up'];
const SNOW = '#dfe8f5', SNOW_S = '#b9c7dc', SNOW_H = '#f4f8fd';

const px = (c: Ctx, x: number, y: number, w: number, h: number, col: string) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const cl = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
function rgb(c: string): [number, number, number] { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function hexOf(r: number, g: number, b: number) { return '#' + ((1 << 24) + (cl(r) << 16) + (cl(g) << 8) + cl(b)).toString(16).slice(1); }
export function shade(c: string, amt: number) { const [r, g, b] = rgb(c); return hexOf(r + amt, g + amt, b + amt); }
function mix(a: string, b: string, t: number) { const A = rgb(a), B = rgb(b); return hexOf(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }
function hash(x: number, y: number) { let h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function rng(seed: number) { let s = seed >>> 0 || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }

function make(scene: Phaser.Scene, key: string, w: number, h: number) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, w, h)!;
  const ctx = tex.getContext(); ctx.imageSmoothingEnabled = false;
  return { tex, ctx };
}
function circle(c: Ctx, cx: number, cy: number, r: number, col: string) {
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) px(c, cx + x, cy + y, 1, 1, col);
}

export function generateTextures(scene: Phaser.Scene) {
  genBasics(scene);
  genGround(scene);
  BUILDINGS.forEach((b) => genBuilding(scene, b));
  genTrees(scene);
  genLamps(scene);
  genCharacters(scene);
  genProps(scene);
  genInterior(scene);
  genIcons(scene);
  genPortraits(scene);
  genTitle(scene);
}

/* ------------------------------------------------------------------ basics */
function genBasics(scene: Phaser.Scene) {
  { const { tex, ctx } = make(scene, 'light', 128, 128);
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,0.8)');
    g.addColorStop(0.65, 'rgba(255,255,255,0.28)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128); tex.refresh(); }
  { const { tex, ctx } = make(scene, 'flake-s', 2, 2); px(ctx, 0, 0, 2, 2, '#eef4ff'); tex.refresh(); }
  { const { tex, ctx } = make(scene, 'flake-l', 3, 3); px(ctx, 1, 0, 1, 3, '#ffffff'); px(ctx, 0, 1, 3, 1, '#ffffff'); tex.refresh(); }
  { const { tex, ctx } = make(scene, 'glint', 7, 7);
    px(ctx, 3, 0, 1, 7, 'rgba(255,255,255,0.7)'); px(ctx, 0, 3, 7, 1, 'rgba(255,255,255,0.7)'); px(ctx, 2, 2, 3, 3, 'rgba(255,255,255,0.9)'); px(ctx, 3, 3, 1, 1, '#fff'); tex.refresh(); }
  { const { tex, ctx } = make(scene, 'battery', 8, 12);
    px(ctx, 3, 0, 2, 1, '#9aa4b4'); px(ctx, 1, 1, 6, 11, '#1e232e'); px(ctx, 2, 2, 4, 9, '#2e3542');
    px(ctx, 2, 3, 4, 2, '#e6c34a'); px(ctx, 2, 6, 4, 1, '#6fd46a'); px(ctx, 2, 8, 4, 1, '#6fd46a'); px(ctx, 2, 10, 4, 1, '#6fd46a'); px(ctx, 1, 1, 1, 11, '#3a4254'); tex.refresh(); }
  { const { tex, ctx } = make(scene, 'bootprint', 5, 8);
    px(ctx, 1, 0, 3, 4, '#6d7c98'); px(ctx, 0, 1, 5, 2, '#6d7c98'); px(ctx, 1, 5, 3, 3, '#6d7c98');
    px(ctx, 2, 1, 1, 1, '#a9c4ea'); px(ctx, 1, 2, 3, 1, '#8fa8cc'); px(ctx, 2, 6, 1, 1, '#a9c4ea'); tex.refresh(); }
  { const { tex, ctx } = make(scene, 'step', 3, 3); px(ctx, 0, 0, 3, 3, '#9aabc6'); px(ctx, 1, 1, 1, 1, '#8596b2'); tex.refresh(); }
  // Tileable fog (value-noise fbm)
  { const N = 256; const { tex, ctx } = make(scene, 'fog', N, N); const img = ctx.createImageData(N, N);
    const grid = (g: number, seed: number) => { const r = rng(seed); const v = Array.from({ length: g * g }, () => r());
      const at = (i: number, j: number) => v[(((j % g) + g) % g) * g + (((i % g) + g) % g)];
      return (x: number, y: number) => { const gx = (x / N) * g, gy = (y / N) * g; const x0 = Math.floor(gx), y0 = Math.floor(gy);
        const sx = (gx - x0) ** 2 * (3 - 2 * (gx - x0)), sy = (gy - y0) ** 2 * (3 - 2 * (gy - y0));
        const a = at(x0, y0), b = at(x0 + 1, y0), c = at(x0, y0 + 1), d = at(x0 + 1, y0 + 1);
        return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy; }; };
    const o1 = grid(4, 11), o2 = grid(8, 23), o3 = grid(16, 37);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const v = o1(x, y) * 0.55 + o2(x, y) * 0.3 + o3(x, y) * 0.15; const a = Math.max(0, Math.min(1, (v - 0.32) * 1.9));
      const i = (y * N + x) * 4; img.data[i] = 205; img.data[i + 1] = 218; img.data[i + 2] = 236; img.data[i + 3] = Math.round(a * a * 210);
    }
    ctx.putImageData(img, 0, 0); tex.refresh(); }
}

/* ------------------------------------------------------------------ ground */
function genGround(scene: Phaser.Scene) {
  const W = WORLD.width, H = WORLD.height;
  const { tex, ctx } = make(scene, 'ground', W, H);
  const cls = new Uint8Array(W * H);
  const fill = (x0: number, y0: number, w: number, h: number, v: number) => {
    for (let y = Math.max(0, y0); y < Math.min(H, y0 + h); y++) for (let x = Math.max(0, x0); x < Math.min(W, x0 + w); x++) cls[y * W + x] = v; };
  ROADS.forEach((r) => fill(r.x, r.y, r.w, r.h, 1));
  fill(PLAZA.x, PLAZA.y, PLAZA.w, PLAZA.h, 2);
  for (const i of ICE) for (let y = i.y - i.ry; y <= i.y + i.ry; y++) for (let x = i.x - i.rx; x <= i.x + i.rx; x++)
    if (((x - i.x) / i.rx) ** 2 + ((y - i.y) / i.ry) ** 2 <= 1 && x >= 0 && y >= 0 && x < W && y < H) cls[y * W + x] = 3;
  const img = ctx.createImageData(W, H); const d = img.data;
  const [hy, vx] = [ROADS[0], ROADS[1]];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const n = hash(x, y), big = hash(x >> 3, y >> 3), huge = hash(x >> 5, (y >> 5) + 99);
    let r = 0, g = 0, b = 0; const k = cls[y * W + x];
    if (k === 0) {
      const v = (big - 0.5) * 10 + (huge - 0.5) * 12 + (n - 0.5) * 6;
      r = 212 + v; g = 223 + v; b = 240 + v * 0.6;
      if (n > 0.997) { r = 255; g = 255; b = 255; }
    } else if (k === 1) {
      const v = (big - 0.5) * 8 + (n - 0.5) * 8; r = 112 + v; g = 122 + v; b = 146 + v;
      const inH = y >= hy.y && y < hy.y + hy.h, inV = x >= vx.x && x < vx.x + vx.w;
      const along = inH && !inV ? y - hy.y : inV && !inH ? x - vx.x : -1; const wob = Math.round((hash((inH ? x : y) >> 4, 7) - 0.5) * 2);
      if (along >= 0) {
        const t = along + wob;
        if ((t >= 12 && t <= 15) || (t >= 38 && t <= 41)) { r -= 22; g -= 22; b -= 20; }
        if (along < 4 || along > (inH ? hy.h : vx.w) - 5) { const e = 1 - Math.min(along, (inH ? hy.h : vx.w) - 1 - along) / 4; r += 70 * e; g += 70 * e; b += 60 * e; }
      }
    } else if (k === 2) {
      const row = Math.floor(y / 6); const bx = (x + (row % 2) * 4) % 8, by = y % 6;
      const stone = hash(Math.floor((x + (row % 2) * 4) / 8), row);
      if (bx === 0 || by === 0) { r = 70; g = 76; b = 94; } else { const v = (stone - 0.5) * 22; r = 116 + v; g = 122 + v; b = 142 + v; }
      const drift = hash(x >> 4, y >> 4) * 0.6 + hash(x >> 5, (y >> 5) + 7) * 0.4; if (drift > 0.58 || (drift > 0.5 && n > 0.5)) { const v = (n - 0.5) * 6; r = 206 + v; g = 216 + v; b = 234 + v; }
    } else {
      r = 150; g = 190; b = 222;
      if ((x + y * 2) % 19 === 0 || (x - y) % 23 === 0) { r = 205; g = 228; b = 246; }
      if (n > 0.985) { r = 240; g = 250; b = 255; }
    }
    const i = (y * W + x) * 4; d[i] = cl(r); d[i + 1] = cl(g); d[i + 2] = cl(b); d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  // Soft drifts along the map edges
  const r = rng(5);
  for (let i = 0; i < 260; i++) { const x = r() * W, y = r() * H; if (cls[Math.floor(y) * W + Math.floor(x)] !== 0) continue;
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(Math.round(x), Math.round(y), 6 + Math.round(r() * 10), 2);
    ctx.fillStyle = 'rgba(150,170,205,0.18)'; ctx.fillRect(Math.round(x) + 1, Math.round(y) + 2, 6 + Math.round(r() * 8), 1); }
  tex.refresh();
}

/* --------------------------------------------------------------- buildings */
function genBuilding(scene: Phaser.Scene, b: BuildingDef) {
  const top = b.extraTop ?? 0, W = b.w, H = b.h + top;
  const { tex, ctx: c } = make(scene, `bld-${b.id}`, W, H);
  const r = rng(b.seed);
  const roofH = Math.round(b.h * 0.55), wy = top + roofH, wh = b.h - roofH;
  // Wall: horizontal clapboard with staggered seams
  px(c, 0, wy, W, wh, b.wall);
  let row = 0;
  for (let y = wy; y < H - 4; y += 4, row++) {
    px(c, 0, y + 3, W, 1, shade(b.wall, -18));
    for (let x = (row % 2) * 7; x < W; x += 14) px(c, x, y, 1, 3, shade(b.wall, -9));
    if (hash(row, b.seed) > 0.6) px(c, Math.floor(hash(b.seed, row) * W), y, 6, 1, shade(b.wall, 8));
  }
  px(c, 0, wy, 3, wh, shade(b.wall, -34)); px(c, W - 3, wy, 3, wh, shade(b.wall, -34));
  px(c, 0, wy, W, 3, shade(b.wall, -46));
  px(c, 0, H - 5, W, 5, '#343a48'); for (let x = 0; x < W; x += 7) px(c, x, H - 5, 1, 5, '#262b36');
  // Windows
  const lit: { x: number; y: number }[] = [];
  const winW = 10, winH = 12; const wyy = wy + Math.max(5, Math.floor((wh - 6 - winH) / 2));
  const count = Math.max(1, Math.floor((W - 16) / 28));
  for (let i = 0; i < count; i++) {
    const x = Math.round(8 + ((i + 0.5) * (W - 16)) / count - winW / 2);
    if (b.door !== undefined && Math.abs(x + winW / 2 - b.door) < 17) continue;
    const on = ['inn', 'clinic', 'post'].includes(b.id) || r() < 0.6;
    px(c, x - 1, wyy - 1, winW + 2, winH + 2, '#231a14');
    if (on) {
      px(c, x, wyy, winW, winH, '#d9772a'); px(c, x + 1, wyy + 1, winW - 2, winH - 2, '#ffae48'); px(c, x + 3, wyy + 3, winW - 6, winH - 6, '#ffd98a');
      if (r() < 0.4) px(c, x + 1, wyy + 1, 3, winH - 2, '#8a4a22'); // curtain
      lit.push({ x: b.x + x + winW / 2, y: b.y + b.h });
    } else { px(c, x, wyy, winW, winH, '#121929'); px(c, x + 1, wyy + 1, 2, 4, '#2a3550'); }
    px(c, x + 5, wyy, 1, winH, '#231a14'); px(c, x, wyy + 6, winW, 1, '#231a14');
    px(c, x - 2, wyy + winH + 1, winW + 4, 2, SNOW); px(c, x - 1, wyy - 2, winW + 2, 1, SNOW_S);
  }
  // Door
  if (b.door !== undefined) {
    const dx = b.door - 7;
    px(c, dx - 1, H - 26, 16, 22, '#1e140e');
    px(c, dx, H - 25, 14, 21, b.locked ? '#3b3530' : '#4a2f1e');
    px(c, dx + 4, H - 25, 1, 21, '#33200f'); px(c, dx + 9, H - 25, 1, 21, '#33200f');
    px(c, dx + 11, H - 15, 2, 2, '#d8b25a');
    px(c, dx - 2, H - 5, 18, 2, '#5a6070');
    if (!b.locked) { px(c, dx + 5, H - 31, 4, 1, '#1a1a1a'); px(c, dx + 5, H - 30, 4, 4, '#ffcf7a'); px(c, dx + 6, H - 29, 2, 2, '#fff2c0'); }
  }
  // Sign
  if (b.sign) {
    const sx = W - 18, sy = wy + 6;
    px(c, sx + 5, sy - 3, 1, 3, '#2a2a2a'); px(c, sx, sy, 12, 9, '#5b3d24'); px(c, sx + 1, sy + 1, 10, 7, '#7a5634');
    if (b.sign === 'cross') { px(c, sx + 5, sy + 2, 2, 5, '#c43a3a'); px(c, sx + 3, sy + 3, 6, 2, '#c43a3a'); }
    if (b.sign === 'post') { px(c, sx + 2, sy + 2, 8, 5, '#e8e0cc'); px(c, sx + 2, sy + 2, 4, 1, '#8a7a60'); px(c, sx + 6, sy + 2, 4, 1, '#8a7a60'); px(c, sx + 5, sy + 3, 2, 1, '#8a7a60'); }
    if (b.sign === 'inn') { px(c, sx + 3, sy + 2, 5, 5, '#ffcf6a'); px(c, sx + 8, sy + 3, 1, 3, '#ffcf6a'); px(c, sx + 3, sy + 2, 5, 1, '#fff4d8'); }
    if (b.sign === 'gear') { circle(c, sx + 6, sy + 4, 3, '#aab0b8'); px(c, sx + 5, sy + 3, 2, 2, '#5b3d24'); }
    px(c, sx, sy - 1, 12, 1, SNOW);
  }
  // Roof shingles
  px(c, 0, top, W, roofH, b.roof);
  row = 0;
  for (let y = top + 2; y < wy; y += 3, row++) { px(c, 0, y, W, 1, shade(b.roof, -18)); for (let x = (row % 2) * 4; x < W; x += 8) px(c, x, y - 2, 1, 2, shade(b.roof, -10)); }
  // Snow blanket
  const snowTo = top + Math.floor(roofH * 0.66);
  for (let x = 0; x < W; x++) {
    const edge = snowTo + Math.round(Math.sin(x * 0.33 + b.seed) * 2 + Math.sin(x * 0.09 + b.seed * 2) * 3 + r() * 1.5);
    px(c, x, top, 1, edge - top, SNOW); px(c, x, edge, 1, 1, SNOW_S);
    if (hash(x, b.seed) > 0.93) px(c, x, top + 3 + Math.floor(hash(b.seed, x) * (edge - top - 4)), 1, 1, SNOW_S);
  }
  px(c, 0, top, W, 1, SNOW_H); px(c, 0, top + 1, W, 1, '#eaf0f8');
  px(c, 0, wy - 2, W, 2, shade(b.roof, -40));
  for (let x = 2; x < W - 2; x += 3) { const L = 1 + Math.floor(r() * 5); px(c, x, wy, 1, L, '#bcd6ee'); if (L > 3) px(c, x, wy, 1, 1, '#e8f4ff'); }
  if (b.chimney) {
    const cx = Math.floor(W * 0.72); px(c, cx, top + 3, 9, 12, '#5a4038'); px(c, cx, top + 3, 9, 1, '#6e5046');
    for (let y = top + 5; y < top + 15; y += 3) px(c, cx, y, 9, 1, '#4a342e'); px(c, cx - 1, top + 1, 11, 3, SNOW);
  }
  // Base snow drift
  for (let x = 0; x < W; x++) { const m = 2 + Math.floor((Math.sin(x * 0.21 + b.seed) + 1) * 1.6) + (r() < 0.08 ? 1 : 0); px(c, x, H - m, 1, m, '#d6e0ee'); px(c, x, H - m, 1, 1, SNOW_H); }
  // Steeple
  if (top > 0) {
    const tw = 30, tx = Math.floor(W / 2 - tw / 2), towerTop = 22;
    px(c, tx, towerTop, tw, wy - towerTop + 6, b.wall); px(c, tx, towerTop, 3, wy - towerTop + 6, shade(b.wall, -30)); px(c, tx + tw - 3, towerTop, 3, wy - towerTop + 6, shade(b.wall, -30));
    for (let y = towerTop + 3; y < wy + 6; y += 5) px(c, tx, y, tw, 1, shade(b.wall, -16));
    px(c, tx + 9, towerTop + 6, 12, 14, '#0b0f18'); px(c, tx + 9, towerTop + 5, 12, 1, SNOW); px(c, tx + 13, towerTop + 12, 4, 5, '#b08a3a'); px(c, tx + 14, towerTop + 17, 2, 1, '#6b5222');
    circle(c, tx + 15, towerTop + 30, 4, '#d9d2b8'); px(c, tx + 15, towerTop + 27, 1, 3, '#222'); px(c, tx + 15, towerTop + 30, 3, 1, '#222');
    for (let y = 6; y < towerTop; y++) { const half = Math.round(((y - 6) / (towerTop - 6)) * (tw / 2 + 3)); px(c, W / 2 - half, y, half * 2, 1, b.roof); px(c, W / 2 - half, y, Math.max(1, half - 1), 1, SNOW); }
    px(c, W / 2 - 1, 0, 2, 7, '#c9a65a'); px(c, W / 2 - 3, 2, 6, 2, '#c9a65a');
  }
  tex.refresh();
  b.litWindows = lit;
}

/* ------------------------------------------------------------------- trees */
function genTree(scene: Phaser.Scene, key: string, w: number, h: number, seed: number) {
  const { tex, ctx: c } = make(scene, key, w, h); const r = rng(seed); const cx = Math.floor(w / 2);
  c.fillStyle = 'rgba(20,30,60,0.25)'; c.fillRect(cx - 8, h - 3, 16, 3);
  px(c, cx - 2, h - 9, 4, 9, '#3b2a20'); px(c, cx - 2, h - 9, 1, 9, '#4e392b');
  const layers = 4; const usable = h - 10;
  for (let i = 0; i < layers; i++) {
    const base = h - 8 - Math.round((i * usable) / (layers + 0.6)); const lh = Math.round(usable / 2.4); const lw = (w / 2 - 1) * (1 - i * 0.2);
    for (let rr = 0; rr < lh; rr++) {
      const y = base - lh + rr; if (y < 0) continue; const half = Math.max(1, Math.round((lw * (rr + 1)) / lh));
      px(c, cx - half, y, half * 2, 1, '#1d3833'); px(c, cx - half, y, Math.ceil(half * 0.7), 1, '#274a42');
      if (rr < lh * 0.3) px(c, cx - half, y, half * 2, 1, rr === 0 ? SNOW_H : SNOW);
      else { if (r() < 0.5) px(c, cx - half, y, 1 + Math.floor(r() * 2), 1, SNOW); if (r() < 0.25) px(c, cx - half + Math.floor(r() * half * 2), y, 2, 1, SNOW_S); }
    }
    px(c, cx - Math.round(lw), base, Math.round(lw * 2), 1, '#132824');
    for (let x = cx - Math.round(lw) + 1; x < cx + lw - 1; x += 3) if (r() < 0.6) px(c, x, base - 1, 2, 1, SNOW);
  }
  tex.refresh();
}
function genTrees(scene: Phaser.Scene) {
  genTree(scene, 'tree-a', 30, 48, 3); genTree(scene, 'tree-b', 24, 38, 7); genTree(scene, 'tree-c', 36, 58, 13);
  const { tex, ctx } = make(scene, 'stump', 14, 10); px(ctx, 3, 3, 8, 7, '#3b2a20'); px(ctx, 2, 1, 10, 3, SNOW); px(ctx, 3, 0, 8, 1, SNOW_H); tex.refresh();
}

/* ------------------------------------------------------------------- lamps */
function genLamps(scene: Phaser.Scene) {
  for (const dead of [false, true]) {
    const { tex, ctx: c } = make(scene, dead ? 'lamp-dead' : 'lamp', 12, 46);
    c.fillStyle = 'rgba(20,30,60,0.3)'; c.fillRect(2, 44, 8, 2);
    px(c, 5, 9, 2, 35, '#1a1d26'); px(c, 5, 9, 1, 35, '#2c3140'); px(c, 3, 42, 6, 4, '#1a1d26'); px(c, 3, 41, 6, 1, SNOW);
    px(c, 2, 2, 8, 8, '#161820'); px(c, 3, 3, 6, 6, dead ? '#2a3040' : '#ffcf7a'); if (!dead) px(c, 4, 4, 4, 4, '#fff2c8');
    px(c, 5, 3, 2, 6, '#161820'); px(c, 1, 1, 10, 2, '#161820'); px(c, 1, 0, 10, 1, SNOW); px(c, 4, 10, 4, 1, '#bcd6ee');
    tex.refresh();
  }
}

/* -------------------------------------------------------------- characters */
function drawChar(c: Ctx, ox: number, oy: number, dir: Dir, f: number, p: CharPal) {
  const P = (x: number, y: number, w: number, h: number, col: string) => px(c, ox + x, oy + y, w, h, col);
  const coatD = p.coatDark ?? shade(p.coat, -28), skinD = shade(p.skin, -30), hairD = shade(p.hair, -25);
  const side = dir === 'left' || dir === 'right';
  c.fillStyle = 'rgba(10,16,36,0.35)'; c.fillRect(ox + 3, oy + 22, 10, 2);
  // Legs
  if (!side) {
    const lUp = f === 2 ? 1 : 0, rUp = f === 1 ? 1 : 0;
    P(5, 20, 2, 2 - lUp, p.pants); P(9, 20, 2, 2 - rUp, p.pants);
    P(5, 22 - lUp, 2, 2, p.boots); P(9, 22 - rUp, 2, 2, p.boots);
  } else {
    const a = f === 1 ? 2 : f === 2 ? -2 : 0;
    P(7 - a, 20, 2, 2, shade(p.pants, -12)); P(7 - a, 22, 2, 2, p.boots);
    P(7 + a, 20, 2, 2, p.pants); P(7 + a, 22, 2, 2, p.boots);
  }
  // Coat
  P(4, 12, 8, 8, p.coat); P(3, 18, 10, 2, p.coat); P(3, 19, 10, 1, coatD);
  P(4, 16, 8, 1, coatD);
  if (dir === 'down') { P(7, 12, 2, 7, coatD); P(6, 13, 1, 1, shade(p.coat, 18)); P(9, 14, 1, 1, shade(p.coat, 18)); }
  if (dir === 'up') P(7, 15, 1, 5, coatD);
  if (side) P(dir === 'left' ? 10 : 4, 12, 2, 8, coatD);
  // Arms
  const sw = f === 1 ? 1 : f === 2 ? -1 : 0;
  if (!side) {
    P(2, 13 + sw, 2, 5, coatD); P(2, 18 + sw, 2, 1, p.skin);
    P(12, 13 - sw, 2, 5, coatD); P(12, 18 - sw, 2, 1, p.skin);
  } else {
    const ax = 7 + sw * 2 * (dir === 'left' ? -1 : 1);
    P(ax, 13, 2, 5, coatD); P(ax, 18, 2, 1, p.skin);
  }
  if (p.badge && dir !== 'up') P(dir === 'right' ? 9 : 5, 14, 1, 1, '#e8c547');
  // Head
  P(5, 5, 6, 6, p.skin); P(6, 11, 4, 1, skinD);
  if (dir === 'down') { P(10, 6, 1, 5, skinD); P(6, 8, 1, 1, '#161620'); P(9, 8, 1, 1, '#161620'); }
  if (dir === 'left') { P(6, 8, 1, 1, '#161620'); P(4, 8, 1, 1, p.skin); P(10, 6, 1, 5, skinD); }
  if (dir === 'right') { P(9, 8, 1, 1, '#161620'); P(11, 8, 1, 1, p.skin); P(5, 6, 1, 5, skinD); }
  // Hair
  const hs = p.hairStyle;
  if (hs !== 'bald') {
    P(5, 4, 6, 2, p.hair);
    if (dir === 'down') { P(5, 6, 1, 2, p.hair); P(10, 6, 1, 2, p.hair); }
    if (dir === 'up') P(5, 4, 6, 7, p.hair);
    if (dir === 'left') P(8, 4, 3, 5, p.hair);
    if (dir === 'right') P(5, 4, 3, 5, p.hair);
    P(5, 4, 6, 1, hairD);
    if (hs === 'messy') { P(4, 4, 1, 1, p.hair); P(11, 3, 1, 2, p.hair); P(7, 3, 2, 1, p.hair); }
    if (hs === 'bun') { if (dir === 'up' || dir === 'down') P(7, 2, 2, 2, p.hair); else P(dir === 'left' ? 10 : 4, 4, 2, 2, p.hair); }
    if (hs === 'long') { if (dir !== 'right') P(10, 6, 1, 5, p.hair); if (dir !== 'left') P(5, 6, 1, 5, p.hair); if (dir === 'up') P(5, 4, 6, 8, p.hair); }
  } else { if (dir !== 'up') { P(5, 7, 1, 2, p.hair); P(10, 7, 1, 2, p.hair); } else P(5, 7, 6, 3, p.hair); P(6, 5, 3, 1, shade(p.skin, 20)); }
  if (p.beard && dir !== 'up') { if (dir === 'down') { P(5, 9, 6, 3, p.beard); P(7, 10, 2, 1, shade(p.beard, -30)); } else P(dir === 'left' ? 5 : 7, 9, 4, 3, p.beard); }
  if (p.glasses && dir !== 'up') { if (dir === 'down') { P(6, 8, 1, 1, '#d8e8f8'); P(9, 8, 1, 1, '#d8e8f8'); P(7, 8, 2, 1, '#8894a4'); } else P(dir === 'left' ? 5 : 9, 8, 2, 1, '#d8e8f8'); }
  // Scarf
  if (p.scarf) { P(5, 11, 6, 2, p.scarf); P(5, 12, 6, 1, shade(p.scarf, -25)); if (dir === 'down') P(9, 13, 2, 3, p.scarf); if (side) P(dir === 'left' ? 10 : 4, 12, 2, 3, p.scarf); if (dir === 'up') P(6, 13, 2, 3, p.scarf); }
  // Hats
  if (p.hat) {
    const hc = p.hatColor ?? '#333', hd = shade(hc, -25);
    if (p.hat === 'fedora') { P(3, 5, 10, 1, hc); P(5, 2, 6, 3, hc); P(5, 4, 6, 1, hd); P(6, 2, 4, 1, SNOW); if (side) P(dir === 'left' ? 2 : 12, 5, 2, 1, hc); }
    if (p.hat === 'beanie') { P(5, 3, 6, 3, hc); P(4, 5, 8, 1, hd); P(7, 1, 2, 2, '#e8e8e8'); }
    if (p.hat === 'campaign') { P(2, 5, 12, 1, hc); P(5, 2, 6, 3, hc); P(7, 2, 2, 1, hd); P(5, 4, 6, 1, '#3a2a1a'); }
  }
}

function genCharacters(scene: Phaser.Scene) {
  const { tex, ctx } = make(scene, 'detective', 48, 96);
  DIRS.forEach((d, row) => { for (let f = 0; f < 3; f++) { drawChar(ctx, f * 16, row * 24, d, f, PALETTES.detective); tex.add(`${d}-${f}`, 0, f * 16, row * 24, 16, 24); } });
  tex.refresh();
  for (const id of ['halvorsen', 'brandt', 'henrik', 'oskar', 'jonah']) {
    const t = make(scene, `npc-${id}`, 16, 24); drawChar(t.ctx, 0, 0, 'down', 0, PALETTES[id]); t.tex.refresh();
  }
  // The victim, lying in the snow
  const tmp = document.createElement('canvas'); tmp.width = 16; tmp.height = 24; const tc = tmp.getContext('2d')!; tc.imageSmoothingEnabled = false;
  drawChar(tc, 0, 0, 'down', 0, PALETTES.mara); tc.clearRect(0, 22, 16, 2);
  const b = make(scene, 'body', 28, 18); const c = b.ctx;
  c.fillStyle = 'rgba(10,16,36,0.35)'; c.fillRect(2, 14, 24, 3);
  c.save(); c.translate(2, 16); c.rotate(-Math.PI / 2); c.drawImage(tmp, 0, 0); c.restore();
  const r = rng(99); for (let i = 0; i < 40; i++) px(c, 2 + r() * 24, 1 + r() * 15, 1, 1, r() < 0.5 ? '#eef4ff' : '#c8d8ee');
  for (let x = 0; x < 28; x++) if (r() < 0.6) px(c, x, 15 + Math.floor(r() * 2), 1, 3, SNOW);
  b.tex.refresh();
}

/* ------------------------------------------------------------------- props */
function genProps(scene: Phaser.Scene) {
  { const { tex, ctx: c } = make(scene, 'monument', 22, 44);
    c.fillStyle = 'rgba(10,16,36,0.35)'; c.fillRect(1, 41, 20, 3);
    px(c, 2, 36, 18, 7, '#4e5566'); px(c, 2, 36, 18, 1, SNOW); px(c, 5, 8, 12, 28, '#646b7c'); px(c, 5, 8, 2, 28, '#7a8294'); px(c, 15, 8, 2, 28, '#4e5566');
    px(c, 4, 4, 14, 5, '#565d6e'); px(c, 4, 3, 14, 2, SNOW); px(c, 8, 0, 6, 4, '#565d6e'); px(c, 8, 0, 6, 1, SNOW_H);
    circle(c, 11, 16, 4, '#e2dcc6'); px(c, 11, 13, 1, 3, '#222'); px(c, 11, 16, 1, 3, '#222'); circle(c, 11, 16, 0, '#222');
    for (let y = 22; y < 34; y += 4) px(c, 6, y, 10, 1, '#555c6c'); px(c, 7, 35, 8, 1, '#bcd6ee'); tex.refresh(); }
  { const { tex, ctx: c } = make(scene, 'police-car', 48, 28);
    c.fillStyle = 'rgba(10,16,36,0.4)'; c.fillRect(2, 24, 44, 4);
    px(c, 2, 12, 44, 12, '#1d2436'); px(c, 2, 16, 44, 3, '#d8dce4'); px(c, 2, 12, 44, 1, '#2e3850');
    px(c, 10, 4, 26, 9, '#1d2436'); px(c, 12, 5, 10, 6, '#35455e'); px(c, 24, 5, 10, 6, '#35455e'); px(c, 13, 6, 3, 2, '#6b82a6');
    px(c, 18, 2, 5, 3, '#d2303a'); px(c, 23, 2, 5, 3, '#2f5ad8'); px(c, 10, 3, 26, 1, SNOW); px(c, 11, 1, 6, 2, SNOW);
    px(c, 4, 22, 7, 4, '#0c0c10'); px(c, 36, 22, 7, 4, '#0c0c10'); px(c, 2, 14, 3, 2, '#ffe6a0'); px(c, 43, 14, 3, 2, '#a02028');
    for (let x = 2; x < 46; x += 2) if (hash(x, 3) > 0.4) px(c, x, 11, 2, 1, SNOW); tex.refresh(); }
  { const { tex, ctx: c } = make(scene, 'plow', 64, 34);
    c.fillStyle = 'rgba(10,16,36,0.4)'; c.fillRect(4, 30, 58, 4);
    px(c, 20, 12, 40, 16, '#d8a81c'); px(c, 20, 12, 40, 2, '#f0c440'); px(c, 20, 24, 40, 4, '#8a6a10');
    px(c, 36, 2, 22, 12, '#c89818'); px(c, 39, 4, 16, 7, '#2a3a52'); px(c, 40, 5, 4, 2, '#6b82a6'); px(c, 36, 1, 22, 2, SNOW);
    px(c, 46, 0, 4, 2, '#ff9a20');
    px(c, 2, 14, 16, 16, '#7a808c'); px(c, 2, 14, 16, 2, '#a0a6b0'); for (let y = 17; y < 30; y += 3) px(c, 3, y, 14, 1, '#5a606c'); px(c, 0, 26, 20, 5, SNOW);
    px(c, 24, 26, 9, 6, '#0c0c10'); px(c, 48, 26, 9, 6, '#0c0c10'); px(c, 58, 16, 3, 3, '#ffe6a0'); tex.refresh(); }
  { const { tex, ctx: c } = make(scene, 'bench', 26, 12); px(c, 1, 3, 24, 3, '#4a3424'); px(c, 1, 7, 24, 2, '#3a281c'); px(c, 3, 9, 2, 3, '#1c1c22'); px(c, 21, 9, 2, 3, '#1c1c22'); px(c, 1, 2, 24, 2, SNOW); px(c, 1, 6, 24, 1, SNOW); tex.refresh(); }
  { const { tex, ctx: c } = make(scene, 'mailbox', 8, 14); px(c, 3, 8, 2, 6, '#1c1c22'); px(c, 0, 2, 8, 7, '#a02828'); px(c, 0, 2, 8, 1, '#c84040'); px(c, 1, 4, 6, 1, '#3a0e0e'); px(c, 0, 0, 8, 2, SNOW); tex.refresh(); }
  { const { tex, ctx: c } = make(scene, 'notice', 16, 24); px(c, 2, 8, 2, 16, '#2a1e16'); px(c, 12, 8, 2, 16, '#2a1e16'); px(c, 0, 2, 16, 12, '#4a3424');
    px(c, 2, 4, 6, 8, '#e8e0cc'); px(c, 9, 3, 5, 6, '#d8c8a8'); px(c, 3, 5, 4, 1, '#8a2020'); px(c, 3, 7, 4, 1, '#666'); px(c, 3, 9, 3, 1, '#666'); px(c, 10, 5, 3, 3, '#6a5a40'); px(c, 0, 1, 16, 2, SNOW); tex.refresh(); }
  { const { tex, ctx: c } = make(scene, 'signpost', 16, 24); px(c, 7, 6, 2, 18, '#2a1e16'); px(c, 1, 3, 14, 6, '#5b3d24'); px(c, 2, 5, 9, 1, '#e8e0cc'); px(c, 11, 4, 3, 4, '#5b3d24'); px(c, 1, 2, 14, 1, SNOW); tex.refresh(); }
  { const { tex, ctx: c } = make(scene, 'crate', 14, 12); px(c, 0, 2, 14, 10, '#6a4a2e'); px(c, 0, 2, 14, 1, '#8a6a44'); px(c, 0, 6, 14, 1, '#4a321e'); px(c, 6, 2, 2, 10, '#4a321e'); px(c, 0, 0, 14, 3, SNOW); tex.refresh(); }
  { const { tex, ctx: c } = make(scene, 'barrel', 12, 14); px(c, 1, 2, 10, 12, '#5a3a24'); px(c, 1, 4, 10, 1, '#2a2a30'); px(c, 1, 10, 10, 1, '#2a2a30'); px(c, 2, 2, 2, 12, '#6e4a30'); px(c, 1, 0, 10, 3, SNOW); tex.refresh(); }
}

/* ---------------------------------------------------------------- interior */
function genInterior(scene: Phaser.Scene) {
  { const { tex, ctx: c } = make(scene, 'floor-wood', 32, 32);
    for (let y = 0; y < 32; y += 8) { const base = ['#4e3524', '#553a28', '#4a3222', '#573c29'][y / 8];
      px(c, 0, y, 32, 8, base); px(c, 0, y + 7, 32, 1, '#2e1f14'); const off = (y / 8) % 2 ? 12 : 26; px(c, off, y, 1, 7, '#2e1f14');
      for (let x = 0; x < 32; x++) if (hash(x, y) > 0.8) px(c, x, y + 2 + Math.floor(hash(y, x) * 4), 1, 1, shade(base, -8)); }
    px(c, 5, 3, 2, 1, '#3a281a'); tex.refresh(); }
  { const { tex, ctx: c } = make(scene, 'floor-tile', 32, 32);
    for (let y = 0; y < 32; y += 8) for (let x = 0; x < 32; x += 8) { px(c, x, y, 8, 8, ((x + y) / 8) % 2 ? '#6d777c' : '#7f8a8f'); px(c, x, y, 8, 1, '#5a6368'); px(c, x, y, 1, 8, '#5a6368'); }
    tex.refresh(); }
  { const { tex, ctx: c } = make(scene, 'floor-stone', 32, 32);
    px(c, 0, 0, 32, 32, '#4a4e5a'); for (const [x, y, w, h] of [[0, 0, 16, 12], [16, 0, 16, 12], [0, 12, 10, 10], [10, 12, 22, 10], [0, 22, 20, 10], [20, 22, 12, 10]]) {
      px(c, x, y, w, h, shade('#555a68', Math.floor(hash(x, y) * 14) - 7)); px(c, x, y, w, 1, '#3a3e48'); px(c, x, y, 1, h, '#3a3e48'); }
    tex.refresh(); }
  const wall = (key: string, paper: string, stripe: string, wood: string) => {
    const { tex, ctx: c } = make(scene, key, 32, 28);
    px(c, 0, 0, 32, 18, paper); for (let x = 0; x < 32; x += 8) px(c, x + 3, 0, 2, 18, stripe);
    px(c, 0, 0, 32, 2, shade(paper, -30)); px(c, 0, 17, 32, 1, shade(wood, 30)); px(c, 0, 18, 32, 10, wood);
    for (let x = 0; x < 32; x += 16) px(c, x, 18, 1, 10, shade(wood, -20)); px(c, 0, 27, 32, 1, shade(wood, -35)); tex.refresh(); };
  wall('wall-post', '#3e5170', '#46597a', '#4a3222');
  wall('wall-clinic', '#7d9488', '#86a092', '#5a6064');
  wall('wall-inn', '#5a2a2a', '#632f2f', '#3e2618');
  { const { tex, ctx: c } = make(scene, 'wall-church', 32, 28);
    px(c, 0, 0, 32, 28, '#5c6070'); for (let y = 0; y < 28; y += 7) { px(c, 0, y, 32, 1, '#454956'); const o = (y / 7) % 2 ? 0 : 8; for (let x = o; x < 32; x += 16) px(c, x, y, 1, 7, '#454956'); }
    px(c, 12, 4, 8, 14, '#1c2a48'); px(c, 13, 5, 6, 12, '#2c4478'); px(c, 15, 5, 2, 12, '#b08a3a'); px(c, 13, 10, 6, 1, '#b08a3a'); tex.refresh(); }

  const f = (key: string, w: number, h: number, draw: (c: Ctx) => void) => { const { tex, ctx } = make(scene, key, w, h); draw(ctx); tex.refresh(); };
  const shadow = (c: Ctx, w: number, h: number) => { c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(1, h - 3, w - 2, 3); };
  f('counter', 96, 22, (c) => { shadow(c, 96, 22); px(c, 0, 0, 96, 8, '#7a5634'); px(c, 0, 0, 96, 1, '#9a7650'); px(c, 0, 8, 96, 12, '#4a3222'); for (let x = 4; x < 96; x += 16) px(c, x, 10, 10, 8, '#3a2618'); px(c, 10, 2, 8, 5, '#e8e0cc'); px(c, 60, 1, 6, 6, '#c8a060'); });
  f('shelf', 30, 34, (c) => { shadow(c, 30, 34); px(c, 0, 0, 30, 32, '#3a2618'); for (let y = 2; y < 30; y += 8) { px(c, 2, y, 26, 7, '#1e140c'); for (let x = 3; x < 27; x += 3) px(c, x, y + 1 + (hash(x, y) > 0.5 ? 1 : 0), 2, 6 - (hash(x, y) > 0.5 ? 1 : 0), ['#8a3030', '#3a5a8a', '#c8b890', '#5a7a4a', '#e8e0cc'][Math.floor(hash(y, x) * 5)]); px(c, 2, y + 7, 26, 1, '#5a3e28'); } });
  f('desk', 34, 20, (c) => { shadow(c, 34, 20); px(c, 0, 0, 34, 9, '#6a4a2e'); px(c, 0, 0, 34, 1, '#8a6a44'); px(c, 1, 9, 32, 9, '#4a321e'); px(c, 2, 11, 12, 6, '#3a2618'); px(c, 20, 11, 12, 6, '#3a2618'); px(c, 4, 2, 7, 5, '#e8e0cc'); px(c, 14, 2, 6, 4, '#d8d0b8'); px(c, 26, 1, 3, 5, '#c8a040'); });
  f('stove', 18, 28, (c) => { shadow(c, 18, 28); px(c, 7, 0, 4, 8, '#1a1a1e'); px(c, 1, 8, 16, 18, '#222228'); px(c, 1, 8, 16, 1, '#3a3a44'); px(c, 4, 14, 10, 7, '#140c08'); px(c, 5, 16, 8, 4, '#ff7a2a'); px(c, 6, 17, 6, 2, '#ffd070'); });
  f('cabinet', 24, 34, (c) => { shadow(c, 24, 34); px(c, 0, 0, 24, 32, '#b8bcc4'); px(c, 0, 0, 24, 1, '#d8dce4'); px(c, 2, 2, 20, 13, '#8fa0b0'); px(c, 3, 3, 8, 11, '#a8c0d4'); px(c, 13, 3, 8, 11, '#a8c0d4');
    for (let x = 4; x < 20; x += 3) px(c, x, 8, 2, 5, ['#e8e8f0', '#c8a860', '#6a9ad0'][x % 3]); px(c, 2, 17, 20, 13, '#9aa0aa'); px(c, 11, 22, 2, 2, '#e8c547'); px(c, 11, 20, 2, 1, '#3a3a44'); });
  f('bed', 26, 40, (c) => { shadow(c, 26, 40); px(c, 0, 0, 26, 38, '#5a5e6a'); px(c, 2, 2, 22, 8, '#e8eef4'); px(c, 2, 10, 22, 26, '#8aa0b8'); px(c, 2, 10, 22, 2, '#a8bcd0'); px(c, 0, 0, 26, 2, '#3a3e48'); });
  f('curtain', 26, 40, (c) => { px(c, 0, 0, 26, 2, '#8a8e98'); for (let x = 0; x < 26; x += 4) { px(c, x, 2, 4, 36, '#c8d4c8'); px(c, x + 3, 2, 1, 36, '#98a898'); } px(c, 0, 36, 26, 2, '#a0b0a0'); });
  f('table', 28, 18, (c) => { shadow(c, 28, 18); px(c, 0, 0, 28, 10, '#6a4a2e'); px(c, 0, 0, 28, 1, '#8a6a44'); px(c, 2, 10, 3, 6, '#3a2618'); px(c, 23, 10, 3, 6, '#3a2618'); px(c, 5, 2, 4, 5, '#d8d0b8'); px(c, 18, 2, 4, 5, '#c89040'); px(c, 19, 1, 2, 1, '#fff'); });
  f('chair', 10, 12, (c) => { px(c, 1, 0, 8, 5, '#4a3222'); px(c, 1, 5, 8, 3, '#6a4a2e'); px(c, 1, 8, 2, 4, '#3a2618'); px(c, 7, 8, 2, 4, '#3a2618'); });
  f('bar', 110, 22, (c) => { shadow(c, 110, 22); px(c, 0, 0, 110, 8, '#6a3a22'); px(c, 0, 0, 110, 1, '#9a5a34'); px(c, 0, 8, 110, 12, '#3e2416'); for (let x = 6; x < 110; x += 14) px(c, x, 10, 1, 9, '#2a180e');
    for (const x of [14, 40, 70, 92]) { px(c, x, 1, 3, 5, '#c8e0f0'); px(c, x, 4, 3, 2, '#e8b040'); } px(c, 58, 0, 2, 6, '#4a8a4a'); });
  f('fireplace', 40, 34, (c) => { shadow(c, 40, 34); px(c, 0, 0, 40, 32, '#5a5e6a'); for (let y = 0; y < 32; y += 5) px(c, 0, y, 40, 1, '#454956'); px(c, 8, 10, 24, 20, '#140c08'); px(c, 10, 22, 20, 6, '#ff6a1a'); px(c, 13, 18, 14, 6, '#ffa030'); px(c, 16, 15, 8, 5, '#ffe080'); px(c, 10, 28, 20, 2, '#3a2010'); px(c, 0, 0, 40, 3, '#3a3e48'); });
  f('pew', 90, 14, (c) => { shadow(c, 90, 14); px(c, 0, 0, 90, 5, '#4a3020'); px(c, 0, 0, 90, 1, '#6a4a30'); px(c, 0, 5, 90, 5, '#5a3a26'); px(c, 0, 10, 3, 4, '#2a1a10'); px(c, 87, 10, 3, 4, '#2a1a10'); px(c, 44, 10, 2, 4, '#2a1a10'); });
  f('altar', 44, 22, (c) => { shadow(c, 44, 22); px(c, 0, 4, 44, 16, '#d8d0c0'); px(c, 0, 4, 44, 2, '#f0e8d8'); px(c, 16, 6, 12, 14, '#7a2a2a'); px(c, 21, 8, 2, 8, '#c9a65a'); px(c, 18, 10, 8, 2, '#c9a65a'); px(c, 4, 0, 6, 4, '#c9a65a'); });
  f('candle', 4, 10, (c) => { px(c, 1, 3, 2, 6, '#f0e8d0'); px(c, 1, 0, 2, 3, '#ffc040'); px(c, 1, 1, 1, 1, '#fff'); px(c, 0, 9, 4, 1, '#b08a3a'); });
  f('hymnboard', 16, 24, (c) => { shadow(c, 16, 24); px(c, 0, 0, 16, 22, '#3a2618'); px(c, 2, 2, 12, 18, '#1a1410'); for (let y = 4; y < 18; y += 5) { px(c, 4, y, 3, 3, '#e8e0cc'); px(c, 9, y, 3, 3, '#e8e0cc'); } });
  f('organ', 40, 30, (c) => { shadow(c, 40, 30); px(c, 0, 0, 40, 28, '#3a2418'); for (let x = 3; x < 38; x += 4) { const h = 6 + Math.round(Math.abs(Math.sin(x)) * 8); px(c, x, 2, 3, h, '#b8b0a0'); px(c, x, 2, 1, h, '#e0d8c8'); } px(c, 4, 18, 32, 4, '#e8e8e0'); for (let x = 5; x < 36; x += 3) px(c, x, 18, 1, 2, '#1a1a1a'); });
  f('rug', 60, 36, (c) => { px(c, 0, 0, 60, 36, '#5a2020'); px(c, 3, 3, 54, 30, '#7a3028'); px(c, 8, 8, 44, 20, '#5a2020'); px(c, 12, 12, 36, 12, '#8a6a30'); for (let x = 0; x < 60; x += 3) { px(c, x, 0, 1, 1, '#c8a870'); px(c, x, 35, 1, 1, '#c8a870'); } });
  f('doormat', 24, 8, (c) => { px(c, 0, 0, 24, 8, '#3a2e22'); px(c, 2, 2, 20, 4, '#4e3e2c'); });
}

/* ------------------------------------------------------------ evidence art */
function genIcons(scene: Phaser.Scene) {
  const draw: Record<string, (c: Ctx) => void> = {
    stopped_watch: (c) => { px(c, 9, 1, 6, 5, '#3a2a1e'); px(c, 9, 18, 6, 5, '#3a2a1e'); circle(c, 12, 12, 7, '#b8a060'); circle(c, 12, 12, 6, '#f0ecd8'); px(c, 11, 7, 1, 5, '#222'); px(c, 8, 11, 4, 1, '#222'); px(c, 14, 8, 3, 1, '#cfe8ff'); px(c, 13, 14, 4, 1, '#cfe8ff'); px(c, 7, 9, 2, 1, '#9ec8f0'); },
    syringe_mark: (c) => { circle(c, 12, 12, 10, '#d8c4b4'); circle(c, 12, 12, 7, '#ccb4a2'); circle(c, 12, 12, 3, '#9a6a78'); px(c, 12, 12, 1, 1, '#4a0a14'); px(c, 11, 11, 1, 1, '#6a1a2a'); for (let i = 0; i < 6; i++) px(c, 4 + i * 3, 3 + (i % 2) * 17, 1, 1, '#eef6ff'); },
    frozen_scarf: (c) => { for (let x = 2; x < 22; x++) { const y = 8 + Math.round(Math.sin(x * 0.5) * 3); px(c, x, y, 1, 7, '#8a8f99'); px(c, x, y, 1, 1, '#a8adb6'); if (x % 4 === 0) px(c, x, y + 2, 1, 3, '#6e737c'); } px(c, 19, 15, 1, 5, '#8a8f99'); px(c, 21, 15, 1, 4, '#8a8f99'); px(c, 7, 10, 2, 2, '#c43a3a'); px(c, 10, 10, 2, 2, '#c43a3a'); for (let i = 0; i < 8; i++) px(c, 3 + i * 2.5, 6 + (i % 3) * 5, 1, 1, '#eef6ff'); },
    small_bootprints: (c) => { const bp = (x: number, y: number) => { px(c, x + 1, y, 4, 6, '#5a6a88'); px(c, x, y + 1, 6, 4, '#5a6a88'); px(c, x + 1, y + 7, 4, 4, '#5a6a88'); px(c, x + 2, y + 2, 2, 1, '#d8e8ff'); px(c, x + 2, y + 1, 1, 3, '#d8e8ff'); px(c, x + 2, y + 8, 2, 1, '#d8e8ff'); };
      px(c, 0, 0, 24, 24, '#c8d6ea'); bp(3, 11); bp(13, 2); },
    torn_letter: (c) => { px(c, 3, 3, 18, 18, '#e8e0cc'); for (let y = 3; y < 21; y += 2) px(c, 19 + (y % 4 ? 1 : 0), y, 3, 2, '#1a2233'); px(c, 5, 6, 12, 1, '#3a3a5a'); px(c, 5, 9, 10, 1, '#3a3a5a'); px(c, 5, 12, 12, 1, '#3a3a5a'); px(c, 5, 15, 7, 1, '#3a3a5a'); px(c, 5, 18, 5, 1, '#8a2020'); px(c, 3, 3, 18, 1, '#f8f4e8'); },
    sedative_ledger: (c) => { px(c, 3, 2, 18, 20, '#4a2a1a'); px(c, 5, 3, 15, 18, '#e8e0cc'); for (let y = 6; y < 19; y += 3) px(c, 7, y, 11, 1, '#8a8aa0'); px(c, 7, 12, 11, 1, '#c43a3a'); px(c, 16, 11, 3, 3, '#c43a3a'); px(c, 3, 2, 2, 20, '#2a180e'); },
    star_boots: (c) => { const boot = (x: number) => { px(c, x, 3, 6, 13, '#3a2a22'); px(c, x, 16, 10, 5, '#3a2a22'); px(c, x, 21, 10, 1, '#1a1210'); px(c, x + 1, 4, 1, 11, '#5a463a'); px(c, x + 2, 17, 2, 1, '#9ec8f0'); };
      boot(1); boot(12); px(c, 5, 22, 2, 2, '#6ab0f0'); px(c, 17, 22, 2, 1, '#6ab0f0'); px(c, 1, 2, 6, 1, SNOW); px(c, 12, 2, 6, 1, SNOW); },
    plow_log: (c) => { px(c, 4, 3, 16, 19, '#6a4a2e'); px(c, 5, 5, 14, 16, '#f0e8c8'); px(c, 9, 2, 6, 3, '#9aa0aa'); for (let y = 8; y < 20; y += 3) { px(c, 7, y, 3, 1, '#d8a81c'); px(c, 11, y, 6, 1, '#4a4a5a'); } },
    guest_book: (c) => { px(c, 2, 4, 20, 16, '#7a2020'); px(c, 3, 5, 8, 14, '#e8e0cc'); px(c, 13, 5, 8, 14, '#e8e0cc'); px(c, 11, 4, 2, 16, '#4a1010'); for (let y = 7; y < 18; y += 2) { px(c, 4, y, 6, 1, '#6a6a8a'); px(c, 14, y, 6, 1, '#6a6a8a'); } px(c, 2, 20, 20, 1, '#c9a65a'); },
    debt_notice: (c) => { px(c, 4, 2, 16, 20, '#e0d4b4'); px(c, 6, 5, 12, 1, '#4a4a5a'); px(c, 6, 8, 9, 1, '#4a4a5a'); px(c, 6, 11, 11, 1, '#4a4a5a'); circle(c, 15, 17, 3, '#b02828'); px(c, 14, 16, 2, 2, '#e0d4b4'); px(c, 4, 12, 16, 1, '#c8bc9c'); },
    confession_page: (c) => { px(c, 3, 2, 18, 20, '#d8c89a'); px(c, 3, 2, 18, 1, '#e8dcb4'); for (let y = 6; y < 19; y += 4) { px(c, 5, y, 8, 1, '#4a3a2a'); px(c, 15, y, 4, 1, '#8a1a1a'); } px(c, 16, 18, 4, 2, '#1a1a4a'); px(c, 11, 3, 2, 3, '#b08a3a'); px(c, 10, 4, 4, 1, '#b08a3a'); },
  };
  for (const id of EVIDENCE_IDS) {
    const key = `ev-${id}`; const { tex, ctx } = make(scene, key, 24, 24); (draw[id] ?? (() => px(ctx, 6, 6, 12, 12, '#ccc')))(ctx); tex.refresh();
    ICONS[key] = scene.textures.getBase64(key) as string;
  }
}

/* --------------------------------------------------------------- portraits */
function genPortraits(scene: Phaser.Scene) {
  for (const id of ['detective', 'halvorsen', 'brandt', 'henrik', 'oskar', 'jonah']) {
    const p = PALETTES[id]; const key = `portrait-${id}`; const { tex, ctx: c } = make(scene, key, 48, 48);
    const skinD = shade(p.skin, -34), hairD = shade(p.hair, -30), coatD = p.coatDark ?? shade(p.coat, -30);
    for (let y = 0; y < 48; y++) px(c, 0, y, 48, 1, mix('#0a1120', '#1c2a44', y / 48));
    const r = rng(id.length * 13); for (let i = 0; i < 30; i++) px(c, r() * 48, r() * 48, 1, 1, 'rgba(220,235,255,0.5)');
    for (let y = 36; y < 48; y++) { const w = 13 + (y - 36) * 1.6; px(c, 24 - w, y, w * 2, 1, p.coat); px(c, 24 - w, y, 3, 1, coatD); px(c, 24 + w - 3, y, 3, 1, coatD); }
    if (p.badge) px(c, 30, 41, 3, 3, '#e8c547');
    if (id === 'brandt') { px(c, 21, 38, 6, 10, '#9aa0a8'); px(c, 23, 40, 2, 3, '#e8c547'); }
    px(c, 20, 31, 8, 6, skinD);
    for (let y = 12; y < 34; y++) { const inset = y < 15 ? 15 - y : y > 30 ? (y - 30) * 1.5 : 0; px(c, 14 + inset, y, 20 - inset * 2, 1, p.skin); px(c, 30 - inset * 0.2, y, 4 - inset, 1, skinD); }
    px(c, 13, 21, 2, 5, skinD); px(c, 33, 21, 2, 5, skinD);
    px(c, 18, 21, 4, 2, '#e6e6e6'); px(c, 26, 21, 4, 2, '#e6e6e6'); px(c, 19, 21, 2, 2, p.eye ?? '#223'); px(c, 27, 21, 2, 2, p.eye ?? '#223'); px(c, 19, 21, 1, 1, '#0a0a10'); px(c, 27, 21, 1, 1, '#0a0a10');
    px(c, 17, 19, 5, 1, p.hairStyle === 'bald' ? hairD : hairD); px(c, 26, 19, 5, 1, hairD);
    px(c, 23, 23, 2, 4, skinD); px(c, 22, 26, 4, 1, skinD); px(c, 21, 29, 6, 1, '#7a4540');
    if (id === 'jonah' || id === 'oskar') { px(c, 17, 24, 3, 1, '#d88a80'); px(c, 28, 24, 3, 1, '#d88a80'); }
    if (id === 'oskar') { px(c, 18, 23, 4, 1, '#9a6a6a'); px(c, 26, 23, 4, 1, '#9a6a6a'); }
    const hs = p.hairStyle;
    if (hs === 'bald') { px(c, 13, 17, 2, 6, p.hair); px(c, 33, 17, 2, 6, p.hair); px(c, 18, 13, 6, 1, shade(p.skin, 22)); }
    else { px(c, 14, 9, 20, 5, p.hair); px(c, 13, 11, 2, 10, p.hair); px(c, 33, 11, 2, 10, p.hair); px(c, 16, 9, 14, 1, shade(p.hair, 20));
      if (hs === 'messy') { px(c, 15, 7, 3, 2, p.hair); px(c, 20, 6, 3, 3, p.hair); px(c, 26, 7, 4, 2, p.hair); px(c, 31, 8, 2, 3, p.hair); px(c, 17, 13, 5, 2, p.hair); }
      if (hs === 'bun') { px(c, 19, 4, 10, 6, p.hair); px(c, 20, 4, 8, 1, shade(p.hair, 20)); }
      if (hs === 'long') { px(c, 12, 11, 3, 22, p.hair); px(c, 33, 11, 3, 22, p.hair); } }
    if (p.beard) { for (let y = 25; y < 34; y++) { const inset = y > 30 ? (y - 30) * 2 : 0; px(c, 15 + inset, y, 18 - inset * 2, 1, p.beard); } px(c, 21, 28, 6, 1, shade(p.beard, -35)); px(c, 18, 26, 12, 1, shade(p.beard, 15)); }
    if (p.glasses) { c.strokeStyle = '#aab6c4'; c.lineWidth = 1; c.strokeRect(17.5, 20.5, 5, 3); c.strokeRect(25.5, 20.5, 5, 3); px(c, 23, 21, 2, 1, '#aab6c4'); px(c, 18, 21, 1, 1, '#ffffff'); }
    if (p.scarf) { px(c, 16, 34, 16, 4, p.scarf); px(c, 16, 37, 16, 1, shade(p.scarf, -25)); if (id === 'detective') px(c, 27, 38, 4, 7, p.scarf); }
    if (p.hat) { const hc = p.hatColor ?? '#333', hd = shade(hc, -25);
      if (p.hat === 'fedora') { px(c, 8, 12, 32, 2, hc); px(c, 13, 3, 22, 9, hc); px(c, 13, 9, 22, 2, hd); px(c, 15, 3, 18, 1, SNOW); px(c, 10, 12, 28, 1, shade(hc, 15)); }
      if (p.hat === 'beanie') { px(c, 13, 6, 22, 8, hc); px(c, 12, 12, 24, 3, hd); px(c, 21, 2, 6, 4, '#e8e8e8'); for (let x = 14; x < 34; x += 3) px(c, x, 7, 1, 5, hd); }
      if (p.hat === 'campaign') { px(c, 6, 12, 36, 2, hc); px(c, 14, 3, 20, 9, hc); px(c, 23, 3, 2, 5, hd); px(c, 14, 10, 20, 2, '#3a2a1a'); } }
    // cold rim light + frost vignette
    c.fillStyle = 'rgba(160,200,255,0.35)'; for (let y = 14; y < 32; y++) c.fillRect(14 + (y < 15 ? 15 - y : 0), y, 1, 1);
    c.fillStyle = 'rgba(200,225,255,0.25)'; for (let i = 0; i < 20; i++) { const a = r() * Math.PI * 2; c.fillRect(Math.round(24 + Math.cos(a) * 23), Math.round(24 + Math.sin(a) * 23), 1, 1); }
    tex.refresh();
    ICONS[key] = scene.textures.getBase64(key) as string;
  }
}

/* ------------------------------------------------------------ title screen */
function genTitle(scene: Phaser.Scene) {
  const W = 320, H = 180; const { tex, ctx: c } = make(scene, 'title-bg', W, H); const r = rng(2024);
  for (let y = 0; y < H; y++) px(c, 0, y, W, 1, mix('#02040b', '#1b2a48', Math.min(1, y / 130)));
  for (let i = 0; i < 70; i++) px(c, r() * W, r() * 90, 1, 1, r() < 0.3 ? '#cfe0ff' : '#5a6f98');
  const g = c.createRadialGradient(246, 38, 2, 246, 38, 40); g.addColorStop(0, 'rgba(210,225,250,0.55)'); g.addColorStop(1, 'rgba(210,225,250,0)'); c.fillStyle = g; c.fillRect(200, 0, 100, 90);
  circle(c, 246, 38, 11, '#c9d6ec'); circle(c, 243, 36, 3, '#b0c0dc'); circle(c, 250, 42, 2, '#b0c0dc');
  const ridge = (base: number, amp: number, freq: number, col: string, snow: string, seed: number) => {
    for (let x = 0; x < W; x++) { const h = base - Math.abs(Math.sin(x * freq + seed)) * amp - Math.sin(x * freq * 2.7 + seed * 3) * amp * 0.35 - hash(x >> 2, seed) * 2;
      px(c, x, h, 1, H - h, col); px(c, x, h, 1, 2 + Math.floor(hash(x, seed) * 3), snow); } };
  ridge(92, 40, 0.018, '#131d33', '#3c4c6e', 1); ridge(112, 28, 0.03, '#0e172a', '#2c3b5a', 4); ridge(132, 16, 0.05, '#0a1222', '#1f2c46', 9);
  for (let x = 0; x < W; x += 5 + Math.floor(r() * 6)) { const h = 10 + r() * 14, y = 140 + r() * 6; for (let k = 0; k < h; k++) { const half = Math.round((k / h) * 4); px(c, x - half, y - h + k, half * 2 + 1, 1, '#070d1a'); } }
  const houses: [number, number, number][] = [[40, 22, 16], [70, 28, 20], [104, 18, 14], [190, 30, 22], [226, 20, 16], [258, 26, 18], [290, 22, 14]];
  for (const [x, w, h] of houses) { const y = 164 - h; px(c, x, y, w, h, '#060b16'); for (let k = 0; k < 8; k++) px(c, x - 1 + k, y - k, w + 2 - k * 2, 1, '#060b16'); px(c, x - 1, y - 1, w + 2, 1, '#2a3a5a');
    for (let wx = x + 3; wx < x + w - 4; wx += 7) if (r() < 0.75) { px(c, wx, y + 4, 3, 4, '#ffb04a'); const gg = c.createRadialGradient(wx + 1.5, y + 6, 0, wx + 1.5, y + 6, 8); gg.addColorStop(0, 'rgba(255,170,70,0.25)'); gg.addColorStop(1, 'rgba(255,170,70,0)'); c.fillStyle = gg; c.fillRect(wx - 8, y - 2, 19, 16); } }
  px(c, 150, 120, 16, 44, '#060b16'); for (let k = 0; k < 18; k++) px(c, 158 - Math.round(k / 2.2), 102 + k, Math.round(k / 1.1) + 1, 1, '#060b16'); px(c, 157, 94, 2, 8, '#3a3020'); px(c, 155, 96, 6, 2, '#3a3020'); px(c, 155, 128, 6, 7, '#ffcf6a');
  for (let y = 162; y < H; y++) px(c, 0, y, W, 1, mix('#2a3b5c', '#1a263e', (y - 162) / 18)); px(c, 0, 162, W, 1, '#4a5c80');
  for (const lx of [24, 132, 178, 280]) { px(c, lx, 146, 1, 17, '#05080f'); px(c, lx - 1, 145, 3, 2, '#ffd080'); const gg = c.createRadialGradient(lx, 146, 0, lx, 146, 22); gg.addColorStop(0, 'rgba(255,190,100,0.35)'); gg.addColorStop(1, 'rgba(255,190,100,0)'); c.fillStyle = gg; c.fillRect(lx - 22, 124, 44, 44); }
  tex.refresh();
}
