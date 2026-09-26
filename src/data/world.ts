export interface Rect { x: number; y: number; w: number; h: number }
export interface Pt { x: number; y: number }

export const WORLD = { width: 1120, height: 800 };
export const SPAWN = { area: 'town', x: 548, y: 740 };

export const ROADS: Rect[] = [
  { x: 0, y: 360, w: 1120, h: 56 },
  { x: 520, y: 0, w: 56, h: 800 },
];
export const PLAZA: Rect = { x: 430, y: 300, w: 250, h: 180 };
export const ICE = [
  { x: 700, y: 390, rx: 30, ry: 10 }, { x: 548, y: 560, rx: 14, ry: 36 }, { x: 250, y: 392, rx: 26, ry: 9 },
  { x: 548, y: 180, rx: 12, ry: 28 }, { x: 980, y: 386, rx: 34, ry: 11 }, { x: 470, y: 336, rx: 20, ry: 8 },
];
export function isOnIce(x: number, y: number) {
  return ICE.some((i) => ((x - i.x) / i.rx) ** 2 + ((y - i.y) / i.ry) ** 2 <= 1);
}

export interface BuildingDef extends Rect {
  id: string; name: string; wall: string; roof: string; seed: number;
  door?: number;            // local x of door centre
  enter?: string;           // area id
  locked?: string;          // message if locked
  extraTop?: number;        // sprite extends above the footprint (steeple)
  sign?: 'post' | 'cross' | 'inn' | 'gear';
  chimney?: boolean;
  litWindows?: Pt[];        // filled in by texture generator
}

export const BUILDINGS: BuildingDef[] = [
  { id: 'post', name: 'Post Office', x: 300, y: 200, w: 128, h: 96, wall: '#6b4a3a', roof: '#3c4a66', seed: 11, door: 64, enter: 'post', sign: 'post', chimney: true },
  { id: 'clinic', name: 'Brandt Clinic', x: 780, y: 200, w: 128, h: 100, wall: '#7f8490', roof: '#2f3b52', seed: 23, door: 64, enter: 'clinic', sign: 'cross' },
  { id: 'inn', name: 'The Last Lantern', x: 230, y: 470, w: 160, h: 112, wall: '#5a3b2b', roof: '#4a3036', seed: 37, door: 80, enter: 'inn', sign: 'inn', chimney: true },
  { id: 'church', name: 'Hollowpine Chapel', x: 600, y: 40, w: 140, h: 120, wall: '#747a88', roof: '#29324a', seed: 41, door: 70, enter: 'church', extraTop: 48 },
  { id: 'garage', name: 'Council Garage', x: 700, y: 480, w: 140, h: 92, wall: '#4f5a63', roof: '#39424e', seed: 53, door: 70, sign: 'gear', locked: "Padlocked. Jonah's plow idles outside, exhaust curling into the snow." },
  { id: 'h1', name: 'House', x: 60, y: 190, w: 112, h: 88, wall: '#5e4636', roof: '#3a3346', seed: 61, door: 40, chimney: true, locked: 'You knock. No answer. A curtain twitches upstairs.' },
  { id: 'h2', name: 'House', x: 80, y: 540, w: 110, h: 86, wall: '#4d5566', roof: '#2e3548', seed: 67, door: 70, locked: 'Locked. Somewhere inside, a radio is playing a hymn very quietly.' },
  { id: 'h3', name: 'House', x: 930, y: 500, w: 112, h: 88, wall: '#6a5040', roof: '#43333a', seed: 71, door: 56, chimney: true, locked: "A yellowed sign on the door: 'NO VISITORS - FEVER.' It's dated last winter." },
  { id: 'h4', name: 'House', x: 950, y: 110, w: 110, h: 86, wall: '#56463e', roof: '#33394d', seed: 73, door: 30, locked: 'The door is frozen shut.' },
  { id: 'h5', name: 'House', x: 400, y: 630, w: 100, h: 80, wall: '#4a4f5c', roof: '#3b3044', seed: 79, door: 50, locked: 'A dog barks once from inside. Then nothing.' },
  { id: 'h6', name: 'House', x: 170, y: 40, w: 100, h: 80, wall: '#644a3a', roof: '#2f3a4e', seed: 83, door: 50, chimney: true, locked: 'No answer. Fresh footprints lead away from the door, then vanish into the drifts.' },
  { id: 'h7', name: 'House', x: 880, y: 650, w: 120, h: 90, wall: '#5b4c44', roof: '#3d3346', seed: 89, door: 84, locked: 'Someone inside turns off a lamp the moment you knock.' },
  { id: 'h8', name: 'House', x: 620, y: 650, w: 90, h: 76, wall: '#4c4450', roof: '#2d3547', seed: 97, door: 45, locked: 'Locked tight. Salt has been poured in a line across the doorstep.' },
  { id: 'h9', name: 'House', x: 360, y: 40, w: 100, h: 80, wall: '#5a5048', roof: '#3a3148', seed: 101, door: 50, chimney: true, locked: 'Nobody home. Or nobody willing to open the door to a stranger tonight.' },
];

export interface AreaDef {
  id: string; name: string; indoor: boolean; ambient: number; bounds: Rect;
  floor?: string; wall?: string; exit?: Pt; spawn?: Pt;
}

export const AREAS: Record<string, AreaDef> = {
  town: { id: 'town', name: 'Hollowpine', indoor: false, ambient: 0.95, bounds: { x: 0, y: 0, w: 1120, h: 800 } },
  post: { id: 'post', name: 'Post Office', indoor: true, ambient: 0.93, bounds: { x: 1300, y: 40, w: 300, h: 220 }, floor: 'floor-wood', wall: 'wall-post', exit: { x: 364, y: 312 } },
  clinic: { id: 'clinic', name: 'Brandt Clinic', indoor: true, ambient: 0.9, bounds: { x: 1700, y: 40, w: 320, h: 230 }, floor: 'floor-tile', wall: 'wall-clinic', exit: { x: 844, y: 316 } },
  inn: { id: 'inn', name: 'The Last Lantern', indoor: true, ambient: 0.88, bounds: { x: 1300, y: 400, w: 380, h: 260 }, floor: 'floor-wood', wall: 'wall-inn', exit: { x: 310, y: 598 } },
  church: { id: 'church', name: 'Hollowpine Chapel', indoor: true, ambient: 0.94, bounds: { x: 1760, y: 380, w: 300, h: 320 }, floor: 'floor-stone', wall: 'wall-church', exit: { x: 670, y: 176 } },
};
for (const a of Object.values(AREAS)) {
  if (a.indoor) a.spawn = { x: a.bounds.x + a.bounds.w / 2, y: a.bounds.y + a.bounds.h - 18 };
}
const L = (area: string, x: number, y: number): Pt => ({ x: AREAS[area].bounds.x + x, y: AREAS[area].bounds.y + y });

export interface LightDef { dx: number; dy: number; radius: number; intensity: number; color: number; flicker?: number }
export interface FurnitureDef { area: string; key: string; x: number; y: number; collide?: boolean; occlude?: boolean; light?: LightDef }
export const FURNITURE: FurnitureDef[] = [
  // Post office
  { area: 'post', key: 'rug', x: 110, y: 160 },
  { area: 'post', key: 'shelf', x: 14, y: 20, collide: true, occlude: true },
  { area: 'post', key: 'shelf', x: 48, y: 20, collide: true, occlude: true },
  { area: 'post', key: 'counter', x: 40, y: 110, collide: true },
  { area: 'post', key: 'desk', x: 200, y: 120, collide: true },
  { area: 'post', key: 'stove', x: 256, y: 22, collide: true, light: { dx: 9, dy: 26, radius: 56, intensity: 0.75, color: 0xff8a3a, flicker: 0.05 } },
  { area: 'post', key: 'crate', x: 240, y: 180, collide: true },
  { area: 'post', key: 'crate', x: 262, y: 170, collide: true },
  // Clinic
  { area: 'clinic', key: 'cabinet', x: 30, y: 20, collide: true, occlude: true },
  { area: 'clinic', key: 'cabinet', x: 58, y: 20, collide: true, occlude: true },
  { area: 'clinic', key: 'desk', x: 130, y: 90, collide: true, light: { dx: 6, dy: 6, radius: 60, intensity: 0.65, color: 0xfff0c0, flicker: 0.01 } },
  { area: 'clinic', key: 'chair', x: 142, y: 76 },
  { area: 'clinic', key: 'bed', x: 236, y: 36, collide: true },
  { area: 'clinic', key: 'bed', x: 274, y: 36, collide: true },
  { area: 'clinic', key: 'curtain', x: 250, y: 136, collide: true, occlude: true },
  // Inn
  { area: 'inn', key: 'rug', x: 160, y: 100 },
  { area: 'inn', key: 'shelf', x: 20, y: 22, collide: true, occlude: true },
  { area: 'inn', key: 'shelf', x: 54, y: 22, collide: true, occlude: true },
  { area: 'inn', key: 'bar', x: 20, y: 70, collide: true },
  { area: 'inn', key: 'fireplace', x: 320, y: 18, collide: true, light: { dx: 20, dy: 38, radius: 120, intensity: 0.95, color: 0xff7a2a, flicker: 0.06 } },
  { area: 'inn', key: 'table', x: 150, y: 150, collide: true },
  { area: 'inn', key: 'chair', x: 138, y: 152 }, { area: 'inn', key: 'chair', x: 180, y: 152 },
  { area: 'inn', key: 'table', x: 230, y: 180, collide: true },
  { area: 'inn', key: 'chair', x: 218, y: 182 },
  { area: 'inn', key: 'table', x: 300, y: 210, collide: true },
  { area: 'inn', key: 'chair', x: 332, y: 212 },
  { area: 'inn', key: 'barrel', x: 350, y: 70, collide: true },
  // Church
  { area: 'church', key: 'organ', x: 24, y: 22, collide: true, occlude: true },
  { area: 'church', key: 'altar', x: 128, y: 34, collide: true },
  { area: 'church', key: 'candle', x: 120, y: 42, light: { dx: 2, dy: 4, radius: 44, intensity: 0.75, color: 0xffc060, flicker: 0.05 } },
  { area: 'church', key: 'candle', x: 178, y: 42, light: { dx: 2, dy: 4, radius: 44, intensity: 0.75, color: 0xffc060, flicker: 0.05 } },
  { area: 'church', key: 'hymnboard', x: 262, y: 24, collide: true },
  ...[110, 150, 190, 230].flatMap((y) => [
    { area: 'church', key: 'pew', x: 26, y, collide: true },
    { area: 'church', key: 'pew', x: 176, y, collide: true },
  ]),
];

export const AREA_LIGHTS: { area: string; x: number; y: number; radius: number; intensity: number; color: number; flicker?: number }[] = [
  { area: 'post', x: 150, y: 90, radius: 80, intensity: 0.35, color: 0xffc27a, flicker: 0.03 },
  { area: 'clinic', x: 160, y: 110, radius: 90, intensity: 0.4, color: 0xcfe6ff, flicker: 0.08 },
  { area: 'inn', x: 90, y: 56, radius: 70, intensity: 0.55, color: 0xffb060, flicker: 0.02 },
  { area: 'inn', x: 200, y: 150, radius: 70, intensity: 0.35, color: 0xffb060, flicker: 0.02 },
  { area: 'church', x: 150, y: 150, radius: 100, intensity: 0.22, color: 0x7fa0e0 },
];

export interface ClueSpot { id: string; x: number; y: number; label: string }
export const CLUE_SPOTS: ClueSpot[] = [
  { id: 'stopped_watch', x: 610, y: 352, label: "Mara's wrist" },
  { id: 'syringe_mark', x: 638, y: 344, label: "Mara's neck" },
  { id: 'frozen_scarf', x: 656, y: 370, label: 'A scarf in the snow' },
  { id: 'small_bootprints', x: 752, y: 332, label: 'Prints in the snow' },
  { id: 'torn_letter', ...L('post', 216, 152), label: 'Paper under the desk' },
  { id: 'sedative_ledger', ...L('clinic', 56, 66), label: 'Drug register' },
  { id: 'star_boots', ...L('clinic', 292, 176), label: 'Something behind the curtain' },
  { id: 'guest_book', ...L('inn', 40, 100), label: 'Guest book' },
  { id: 'debt_notice', ...L('inn', 314, 238), label: 'A creased note' },
  { id: 'confession_page', ...L('church', 270, 64), label: 'Behind the hymn board' },
];

export const NPC_SPOTS: { id: string; x: number; y: number }[] = [
  { id: 'halvorsen', x: 590, y: 386 },
  { id: 'brandt', ...L('clinic', 185, 112) },
  { id: 'henrik', ...L('inn', 140, 86) },
  { id: 'oskar', ...L('inn', 244, 212) },
  { id: 'jonah', x: 674, y: 606 },
];

export const BATTERIES: { id: string; x: number; y: number }[] = [
  { id: 'b1', x: 180, y: 330 }, { id: 'b2', x: 470, y: 250 }, { id: 'b3', x: 1010, y: 330 },
  { id: 'b4', x: 880, y: 470 }, { id: 'b5', x: 200, y: 700 }, { id: 'b6', x: 560, y: 40 },
  { id: 'b7', ...L('post', 30, 190) }, { id: 'b8', ...L('inn', 350, 110) }, { id: 'b9', ...L('church', 40, 290) },
];

export interface LampDef { x: number; y: number; dead?: boolean; flicker?: number }
export const LAMPS: LampDef[] = [
  { x: 60, y: 354 }, { x: 240, y: 354 }, { x: 700, y: 354 }, { x: 880, y: 354, dead: true }, { x: 1060, y: 354 },
  { x: 140, y: 426 }, { x: 400, y: 426, flicker: 0.08 }, { x: 760, y: 426 }, { x: 980, y: 426 },
  { x: 514, y: 90 }, { x: 514, y: 230 }, { x: 514, y: 500 }, { x: 514, y: 650, flicker: 0.06 },
  { x: 582, y: 150 }, { x: 582, y: 480 }, { x: 582, y: 720 },
  { x: 662, y: 318 },
];

export interface PropDef { key: string; x: number; y: number; collide?: { w: number; h: number }; examine?: string }
export const PROPS: PropDef[] = [
  { key: 'monument', x: 624, y: 336, collide: { w: 20, h: 8 }, examine: "The town clock. Its hands have been stuck at a quarter past three since the winter of the fever. Nobody fixed it." },
  { key: 'police-car', x: 470, y: 452, collide: { w: 46, h: 14 }, examine: "Halvorsen's cruiser. The radio hisses static, and a voice that never finishes a sentence." },
  { key: 'plow', x: 628, y: 604, collide: { w: 62, h: 18 }, examine: "Jonah's plow. The engine is still ticking as it cools." },
  { key: 'notice', x: 286, y: 352, collide: { w: 12, h: 4 }, examine: "ROAD CLOSED UNTIL FURTHER NOTICE - Hollowpine Council. Beneath it, a missing poster for a dog named Bram." },
  { key: 'mailbox', x: 444, y: 298, collide: { w: 8, h: 4 }, examine: 'The mailbox is frozen shut. The last collection was never made.' },
  { key: 'bench', x: 470, y: 322, collide: { w: 24, h: 5 } },
  { key: 'bench', x: 652, y: 472, collide: { w: 24, h: 5 } },
  { key: 'crate', x: 856, y: 560, collide: { w: 14, h: 6 } },
  { key: 'barrel', x: 874, y: 562, collide: { w: 10, h: 6 } },
  { key: 'signpost', x: 604, y: 772, collide: { w: 4, h: 4 } },
];

export const EXIT_ROAD = { x: 548, y: 792 };
export const BOOT_TRAIL = { from: { x: 664, y: 356 }, to: { x: 836, y: 308 }, count: 15 };
