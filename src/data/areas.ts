import type { Rect } from '../systems/types';
import { rng } from '../assets/pixelArt';

export interface LampDef { x: number; y: number; r: number; flicker?: boolean; post?: boolean; tint?: 'warm' | 'cold' | 'fire'; }
export interface WindowDef { x: number; y: number; lit: boolean; }
export type BuildingStyle = 'inn' | 'post' | 'church' | 'clinic' | 'garage' | 'abandoned';
export interface BuildingDef {
  id: string; x: number; y: number; w: number; h: number;
  style: BuildingStyle; wall: string; roof: string;
  windows: WindowDef[]; door: { x: number; w: number };
}
export interface FurnitureDef { type: string; x: number; y: number; w: number; h: number; low?: boolean; }
export type ObjKind = 'evidence' | 'battery' | 'npc' | 'examine' | 'door' | 'decor';
export interface WorldObject {
  id: string; kind: ObjKind; x: number; y: number;
  texture?: string; hidden?: boolean; evidence?: string; npc?: string;
  title?: string; text?: string; to?: string; spawn?: { x: number; y: number };
  label?: string; keep?: boolean; flag?: string; radius?: number; solid?: Rect; flipX?: boolean;
}
export interface AreaDef {
  id: string; name: string; interior: boolean; bounds: Rect; darkness: number;
  floor?: string; wall?: string;
  buildings: BuildingDef[]; furniture: FurnitureDef[]; pines: { x: number; y: number }[];
  lamps: LampDef[]; roads: Rect[]; plazas: Rect[]; paths: Rect[]; objects: WorldObject[];
  // computed
  obstacles: Rect[]; lightBlockers: Rect[]; glows: { x: number; y: number }[];
}

type RawArea = Omit<AreaDef, 'obstacles' | 'lightBlockers' | 'glows'> & { walls?: boolean };

const overlap = (a: Rect, b: Rect) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const grow = (r: Rect, n: number): Rect => ({ x: r.x - n, y: r.y - n, w: r.w + n * 2, h: r.h + n * 2 });

function finalize(a: RawArea): AreaDef {
  const obstacles: Rect[] = [];
  const lightBlockers: Rect[] = [];
  const glows: { x: number; y: number }[] = [];
  for (const b of a.buildings) {
    const r = { x: b.x, y: b.y, w: b.w, h: b.h };
    obstacles.push(r); lightBlockers.push(r);
    for (const w of b.windows) if (w.lit) glows.push({ x: b.x + w.x + 5, y: b.y + w.y + 7 });
  }
  for (const f of a.furniture) {
    const r = { x: f.x, y: f.y, w: f.w, h: f.h };
    obstacles.push(r); if (!f.low) lightBlockers.push(r);
  }
  for (const p of a.pines) {
    obstacles.push({ x: p.x - 4, y: p.y - 5, w: 8, h: 5 });
    lightBlockers.push({ x: p.x - 6, y: p.y - 12, w: 12, h: 12 });
  }
  for (const l of a.lamps) if (l.post) obstacles.push({ x: l.x - 2, y: l.y - 3, w: 4, h: 3 });
  for (const o of a.objects) {
    if (o.kind === 'npc') obstacles.push({ x: o.x - 5, y: o.y - 5, w: 10, h: 5 });
    if (o.solid) { obstacles.push(o.solid); lightBlockers.push(o.solid); }
  }
  if (a.walls) {
    const { x, y, w, h } = a.bounds;
    const walls = [
      { x, y, w, h: 32 }, { x, y, w: 8, h }, { x: x + w - 8, y, w: 8, h }, { x, y: y + h - 8, w, h: 8 },
    ];
    obstacles.push(...walls); lightBlockers.push(...walls);
  }
  return { ...a, obstacles, lightBlockers, glows };
}

// ---------------------------------------------------------------- TOWN
const TOWN_BUILDINGS: BuildingDef[] = [
  { id: 'inn', x: 110, y: 190, w: 190, h: 150, style: 'inn', wall: '#5a3b2b', roof: '#2d2f3d', door: { x: 88, w: 14 },
    windows: [{ x: 20, y: 90, lit: true }, { x: 44, y: 90, lit: true }, { x: 136, y: 90, lit: true }, { x: 160, y: 90, lit: false }, { x: 30, y: 112, lit: true }, { x: 150, y: 112, lit: true }] },
  { id: 'post', x: 360, y: 210, w: 150, h: 130, style: 'post', wall: '#4b4f63', roof: '#27293a', door: { x: 68, w: 14 },
    windows: [{ x: 22, y: 84, lit: false }, { x: 112, y: 84, lit: false }, { x: 22, y: 106, lit: true }] },
  { id: 'church', x: 830, y: 90, w: 170, h: 250, style: 'church', wall: '#6b6f7e', roof: '#2a2c3a', door: { x: 78, w: 16 },
    windows: [{ x: 30, y: 180, lit: true }, { x: 128, y: 180, lit: true }] },
  { id: 'clinic', x: 1060, y: 210, w: 170, h: 130, style: 'clinic', wall: '#8a8f9c', roof: '#2e3240', door: { x: 78, w: 14 },
    windows: [{ x: 24, y: 84, lit: true }, { x: 46, y: 84, lit: false }, { x: 120, y: 84, lit: true }, { x: 142, y: 84, lit: false }] },
  { id: 'garage', x: 140, y: 540, w: 230, h: 150, style: 'garage', wall: '#4e4136', roof: '#2b2a33', door: { x: 108, w: 14 },
    windows: [{ x: 190, y: 96, lit: true }] },
  { id: 'abandoned', x: 1080, y: 560, w: 150, h: 120, style: 'abandoned', wall: '#3b3534', roof: '#22222c', door: { x: 68, w: 14 },
    windows: [{ x: 20, y: 76, lit: false }, { x: 118, y: 76, lit: false }] },
];

const TOWN_ROADS: Rect[] = [{ x: 0, y: 360, w: 1280, h: 56 }, { x: 600, y: 416, w: 56, h: 384 }];
const TOWN_PLAZAS: Rect[] = [{ x: 760, y: 480, w: 300, h: 220 }];
const TOWN_PATHS: Rect[] = [
  { x: 197, y: 340, w: 16, h: 20 }, { x: 427, y: 340, w: 16, h: 20 }, { x: 906, y: 340, w: 18, h: 20 },
  { x: 1137, y: 340, w: 16, h: 20 }, { x: 247, y: 690, w: 16, h: 22 }, { x: 247, y: 700, w: 360, h: 18 },
  { x: 656, y: 640, w: 110, h: 18 }, { x: 910, y: 416, w: 18, h: 64 },
];

function trailPrints(): WorldObject[] {
  const out: WorldObject[] = [];
  const pts: [number, number][] = [];
  for (let i = 0; i <= 26; i++) {
    const t = i / 26;
    let x: number; let y: number;
    if (t < 0.55) { x = 262 + (596 - 262) * (t / 0.55); y = 712 - 4 * Math.sin(t * 9); }
    else { const u = (t - 0.55) / 0.45; x = 660 + (840 - 660) * u; y = 700 - 52 * u; }
    if (x > 594 && x < 662) continue;
    pts.push([x, y]);
  }
  pts.forEach(([x, y], i) => {
    out.push({ id: `trail_${i}`, kind: 'decor', x: Math.round(x), y: Math.round(y + (i % 2 ? 3 : -3)), texture: 'prints', hidden: true, flipX: i > 9 });
  });
  return out;
}

function makePines(): { x: number; y: number }[] {
  const r = rng(1337);
  const blocked: Rect[] = [
    ...TOWN_BUILDINGS.map(b => grow(b, 14)), ...TOWN_ROADS.map(b => grow(b, 12)), ...TOWN_PLAZAS.map(b => grow(b, 12)),
    ...TOWN_PATHS.map(b => grow(b, 14)), { x: 380, y: 400, w: 280, h: 120 }, { x: 440, y: 420, w: 120, h: 60 },
  ];
  const out: { x: number; y: number }[] = [];
  const tryAdd = (x: number, y: number) => {
    const fp = { x: x - 12, y: y - 40, w: 24, h: 40 };
    if (blocked.some(b => overlap(b, fp))) return;
    if (out.some(p => Math.abs(p.x - x) < 18 && Math.abs(p.y - y) < 14)) return;
    out.push({ x, y });
  };
  for (let x = 14; x < 1280; x += 26) { tryAdd(x + Math.floor(r() * 10), 52 + Math.floor(r() * 30)); tryAdd(x + Math.floor(r() * 10), 120 + Math.floor(r() * 40)); }
  for (let x = 10; x < 1280; x += 24) tryAdd(x + Math.floor(r() * 10), 792 - Math.floor(r() * 14));
  for (let y = 180; y < 790; y += 30) { tryAdd(14 + Math.floor(r() * 16), y); tryAdd(1266 - Math.floor(r() * 16), y); }
  for (let i = 0; i < 70; i++) tryAdd(40 + Math.floor(r() * 1200), 440 + Math.floor(r() * 340));
  for (let i = 0; i < 30; i++) tryAdd(520 + Math.floor(r() * 300), 180 + Math.floor(r() * 150));
  return out;
}

const townLamps: LampDef[] = [
  { x: 330, y: 352, r: 80, post: true }, { x: 560, y: 352, r: 80, post: true }, { x: 740, y: 352, r: 80, post: true, flicker: true },
  { x: 1030, y: 352, r: 80, post: true }, { x: 1250, y: 352, r: 80, post: true },
  { x: 775, y: 495, r: 84, post: true }, { x: 1045, y: 495, r: 84, post: true },
  { x: 775, y: 694, r: 84, post: true, flicker: true }, { x: 1045, y: 694, r: 84, post: true },
  { x: 590, y: 560, r: 76, post: true }, { x: 590, y: 780, r: 76, post: true, flicker: true },
  { x: 392, y: 700, r: 70, post: true, flicker: true },
];

const TOWN: RawArea = {
  id: 'town', name: 'Hollowmere', interior: false, darkness: 0.86,
  bounds: { x: 0, y: 0, w: 1280, h: 800 },
  buildings: TOWN_BUILDINGS, furniture: [], pines: makePines(), lamps: townLamps,
  roads: TOWN_ROADS, plazas: TOWN_PLAZAS, paths: TOWN_PATHS,
  objects: [
    { id: 'door_inn', kind: 'door', x: 205, y: 350, to: 'inn', spawn: { x: 2160, y: 196 }, label: 'The Crooked Lantern Inn' },
    { id: 'door_post', kind: 'door', x: 435, y: 350, to: 'post', spawn: { x: 2560, y: 196 }, label: 'the Post Office' },
    { id: 'door_church', kind: 'door', x: 915, y: 350, to: 'church', spawn: { x: 2160, y: 496 }, label: "St. Aldric's Church" },
    { id: 'door_clinic', kind: 'door', x: 1145, y: 350, to: 'clinic', spawn: { x: 2560, y: 496 }, label: 'Brandt Clinic' },
    { id: 'door_garage', kind: 'door', x: 255, y: 700, to: 'garage', spawn: { x: 2160, y: 796 }, label: "Reyn's Garage" },
    { id: 'abandoned_door', kind: 'examine', x: 1155, y: 690, title: 'Boarded House',
      text: 'The Arn house. Boards nailed across the door, the nails already furred with frost. The widow Arn died here last winter. Nobody has lived in it since, and nobody walks this side of the square if they can help it.' },
    { id: 'fountain', kind: 'decor', x: 908, y: 592, texture: 'fountain', solid: { x: 882, y: 562, w: 52, h: 30 } },
    { id: 'body', kind: 'evidence', x: 900, y: 614, texture: 'clue_body', evidence: 'e_body', keep: true, radius: 18 },
    { id: 'needle', kind: 'evidence', x: 926, y: 616, texture: 'sparkle', evidence: 'e_needle', hidden: true, radius: 16 },
    { id: 'scarf', kind: 'evidence', x: 848, y: 596, texture: 'clue_scarf', evidence: 'e_scarf' },
    { id: 'prints', kind: 'evidence', x: 540, y: 706, texture: 'prints', evidence: 'e_prints', hidden: true, radius: 18 },
    ...trailPrints(),
    { id: 'car', kind: 'examine', x: 500, y: 440, texture: 'car', solid: { x: 481, y: 438, w: 38, h: 12 }, title: 'Frozen Car',
      text: "Marta's little post van, buried to the door handles. The driver's seat is empty and the key is still in the ignition. Whatever she went out for, she walked." },
    { id: 'sign', kind: 'examine', x: 660, y: 346, texture: 'sign', title: 'Town Sign',
      text: 'HOLLOWMERE. Elev. 2,140 m. Pop. 212.\nSomeone has scratched a line through the 2 and written 211 beneath it. The frost in the scratches is fresh.' },
    { id: 'bat_t1', kind: 'battery', x: 470, y: 474, texture: 'battery' },
    { id: 'bat_t2', kind: 'battery', x: 1180, y: 742, texture: 'battery' },
    { id: 'bat_t3', kind: 'battery', x: 720, y: 250, texture: 'battery' },
  ],
};

// ---------------------------------------------------------------- INTERIORS
const room = (x: number, y: number) => ({ x, y, w: 320, h: 224 });

const INN: RawArea = {
  id: 'inn', name: 'The Crooked Lantern Inn', interior: true, darkness: 0.9, walls: true,
  bounds: room(2000, 0), floor: '#4a3426', wall: '#5b2f2a',
  buildings: [], pines: [], roads: [], plazas: [], paths: [],
  furniture: [
    { type: 'bar', x: 2030, y: 70, w: 150, h: 18 }, { type: 'shelf', x: 2034, y: 32, w: 60, h: 10, low: true },
    { type: 'table', x: 2212, y: 112, w: 28, h: 18, low: true }, { type: 'table', x: 2252, y: 160, w: 28, h: 18, low: true },
    { type: 'table', x: 2060, y: 150, w: 28, h: 18, low: true }, { type: 'fireplace', x: 2240, y: 32, w: 44, h: 14 },
  ],
  lamps: [{ x: 2262, y: 50, r: 110, tint: 'fire', flicker: true }, { x: 2100, y: 46, r: 96, tint: 'warm' }, { x: 2226, y: 120, r: 50, tint: 'warm' }],
  objects: [
    { id: 'viktor', kind: 'npc', x: 2100, y: 64, npc: 'viktor', texture: 'npc_viktor', radius: 36 },
    { id: 'ledger', kind: 'evidence', x: 2160, y: 80, texture: 'clue_ledger', evidence: 'e_ledger' },
    { id: 'inn_drinks', kind: 'examine', x: 2074, y: 172, title: 'Abandoned Drinks',
      text: 'Three glasses, half full. A skin of ice has formed on one. Whoever sat here left in a hurry when the bell went silent.' },
    { id: 'bat_inn', kind: 'battery', x: 2292, y: 200, texture: 'battery' },
    { id: 'exit_inn', kind: 'door', x: 2160, y: 208, to: 'town', spawn: { x: 205, y: 364 }, label: 'outside' },
  ],
};

const POST: RawArea = {
  id: 'post', name: 'Hollowmere Post Office', interior: true, darkness: 0.93, walls: true,
  bounds: room(2400, 0), floor: '#3c3530', wall: '#2f3b4a',
  buildings: [], pines: [], roads: [], plazas: [], paths: [],
  furniture: [
    { type: 'stove', x: 2420, y: 34, w: 26, h: 22 }, { type: 'desk', x: 2480, y: 38, w: 44, h: 18 },
    { type: 'counter', x: 2440, y: 110, w: 110, h: 14 }, { type: 'shelf', x: 2584, y: 36, w: 56, h: 18 },
    { type: 'shelf', x: 2584, y: 84, w: 56, h: 18 }, { type: 'crate', x: 2600, y: 150, w: 20, h: 16 },
  ],
  lamps: [{ x: 2433, y: 52, r: 56, tint: 'fire', flicker: true }, { x: 2510, y: 60, r: 70, tint: 'warm', flicker: true }],
  objects: [
    { id: 'letter', kind: 'evidence', x: 2433, y: 64, texture: 'clue_letter', evidence: 'e_letter', hidden: true, radius: 18 },
    { id: 'marta_desk', kind: 'examine', x: 2502, y: 64, title: "Marta's Desk", flag: 'saw_desk',
      text: "A list of six names in Marta's handwriting. Every one of them is crossed out. Next to each, a date, and the same initials: I.B.\nThe stove behind the desk is still faintly warm. Someone burned paper here tonight." },
    { id: 'post_shelves', kind: 'examine', x: 2612, y: 110, title: 'Sorting Shelves',
      text: "Pigeonholes for every household in Hollowmere. The one marked BRANDT CLINIC is empty. Every other slot is stuffed with undelivered post." },
    { id: 'bat_post', kind: 'battery', x: 2626, y: 196, texture: 'battery' },
    { id: 'exit_post', kind: 'door', x: 2560, y: 208, to: 'town', spawn: { x: 435, y: 364 }, label: 'outside' },
  ],
};

const CHURCH: RawArea = {
  id: 'church', name: "St. Aldric's Church", interior: true, darkness: 0.92, walls: true,
  bounds: room(2000, 300), floor: '#3a3a44', wall: '#3d3f52',
  buildings: [], pines: [], roads: [], plazas: [], paths: [],
  furniture: [
    { type: 'altar', x: 2130, y: 334, w: 60, h: 14 }, { type: 'lectern', x: 2090, y: 350, w: 14, h: 12 },
    ...[0, 1, 2, 3].flatMap(i => [
      { type: 'pew', x: 2040, y: 386 + i * 26, w: 88, h: 10, low: true },
      { type: 'pew', x: 2192, y: 386 + i * 26, w: 88, h: 10, low: true },
    ]),
  ],
  lamps: [{ x: 2138, y: 338, r: 60, tint: 'fire', flicker: true }, { x: 2182, y: 338, r: 60, tint: 'fire', flicker: true }, { x: 2160, y: 470, r: 50, tint: 'cold' }],
  objects: [
    { id: 'oren', kind: 'npc', x: 2232, y: 356, npc: 'oren', texture: 'npc_oren', radius: 34 },
    { id: 'bell_log', kind: 'evidence', x: 2097, y: 370, texture: 'clue_log', evidence: 'e_bell_log' },
    { id: 'candles', kind: 'examine', x: 2160, y: 358, title: 'Six Candles', flag: 'six_candles',
      text: 'Six candles at the foot of the altar, burnt down to stubs and lit all at once. No names. No note. Only a little wax pooled in the shape of a hand.' },
    { id: 'exit_church', kind: 'door', x: 2160, y: 508, to: 'town', spawn: { x: 915, y: 364 }, label: 'outside' },
  ],
};

const CLINIC: RawArea = {
  id: 'clinic', name: 'Brandt Clinic', interior: true, darkness: 0.9, walls: true,
  bounds: room(2400, 300), floor: '#5b6470', wall: '#9aa4ae',
  buildings: [], pines: [], roads: [], plazas: [], paths: [],
  furniture: [
    { type: 'cabinet', x: 2420, y: 332, w: 44, h: 16 }, { type: 'bed', x: 2566, y: 340, w: 56, h: 26 },
    { type: 'desk', x: 2480, y: 410, w: 50, h: 18 }, { type: 'crate', x: 2640, y: 420, w: 18, h: 14 },
  ],
  lamps: [{ x: 2500, y: 346, r: 90, tint: 'cold' }, { x: 2505, y: 416, r: 46, tint: 'warm' }],
  objects: [
    { id: 'ilse', kind: 'npc', x: 2520, y: 372, npc: 'ilse', texture: 'npc_ilse', radius: 34 },
    { id: 'vial', kind: 'evidence', x: 2444, y: 356, texture: 'clue_vial', evidence: 'e_vial', hidden: true, radius: 16 },
    { id: 'clinic_book', kind: 'examine', x: 2505, y: 436, title: 'Appointment Book',
      text: "Neat columns. Last Tuesday: 'M. Kell. Post collected. Asked about the Hessel file.' The Hessel file itself is not in the drawer where it should be." },
    { id: 'clinic_bed', kind: 'examine', x: 2594, y: 374, title: 'Examination Bed',
      text: 'Freshly made, sheets pulled tight. Folded at the foot: a woollen blanket. There is a gap on the coat hook beside it where a scarf would hang.' },
    { id: 'bat_clinic', kind: 'battery', x: 2640, y: 500, texture: 'battery' },
    { id: 'exit_clinic', kind: 'door', x: 2560, y: 508, to: 'town', spawn: { x: 1145, y: 364 }, label: 'outside' },
  ],
};

const GARAGE: RawArea = {
  id: 'garage', name: "Reyn's Garage", interior: true, darkness: 0.91, walls: true,
  bounds: room(2000, 600), floor: '#3b3c42', wall: '#3e3833',
  buildings: [], pines: [], roads: [], plazas: [], paths: [],
  furniture: [
    { type: 'plow', x: 2030, y: 650, w: 96, h: 48 }, { type: 'bench', x: 2200, y: 632, w: 70, h: 16 },
    { type: 'crate', x: 2280, y: 700, w: 20, h: 18 }, { type: 'crate', x: 2040, y: 760, w: 22, h: 18 },
  ],
  lamps: [{ x: 2150, y: 646, r: 96, tint: 'warm', flicker: true }, { x: 2234, y: 640, r: 50, tint: 'warm' }],
  objects: [
    { id: 'tomas', kind: 'npc', x: 2200, y: 704, npc: 'tomas', texture: 'npc_tomas', radius: 34 },
    { id: 'plow', kind: 'examine', x: 2078, y: 708, title: 'Snowplow',
      text: 'The blade is still packed with fresh snow and the engine block ticks as it cools. Whatever else Tomas did last night, he also cleared a lot of road.' },
    { id: 'boots', kind: 'examine', x: 2236, y: 656, title: 'Work Boots', flag: 'saw_boots',
      text: 'A pair of heavy boots drying by the bench. Size 46. The treads are deep and distinctive.' },
    { id: 'bat_garage', kind: 'battery', x: 2290, y: 792, texture: 'battery' },
    { id: 'exit_garage', kind: 'door', x: 2160, y: 808, to: 'town', spawn: { x: 255, y: 714 }, label: 'outside' },
  ],
};

export const AREAS: Record<string, AreaDef> = Object.fromEntries(
  [TOWN, INN, POST, CHURCH, CLINIC, GARAGE].map(a => [a.id, finalize(a)]),
);

export const START = { area: 'town', x: 684, y: 452 };
