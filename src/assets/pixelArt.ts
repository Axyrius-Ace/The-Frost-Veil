/**
 * Pure canvas pixel-art routines. Shared by the Phaser TextureFactory (world sprites)
 * and React (dialogue portraits), so every character is authored exactly once.
 */
export type Ctx = CanvasRenderingContext2D;

export function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  return { c, g };
}

/** mulberry32: small deterministic RNG so the town looks the same every run */
export function rng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const PAL = {
  snow: '#d6e1ef', snowShade: '#b4c3d8', snowLight: '#eef3fa', ice: '#627891', iceLight: '#8ea5bd', iceDark: '#4b5d73',
  night: '#05070f', amber: '#ffb45a', amberLight: '#ffe0a0', ink: '#121218',
};

export type Facing = 'down' | 'up' | 'side';

export function drawDetective(g: Ctx, ox: number, oy: number, dir: Facing, step: number) {
  const P = (x: number, y: number, w: number, h: number, c: string) => { g.fillStyle = c; g.fillRect(ox + x, oy + y, w, h); };
  const coat = '#4d3c30', coatD = '#33281f', coatL = '#6c5644', hat = '#1c191e', band = '#6a2629';
  const skin = '#e2b48c', skinD = '#b98563', scarf = '#94292f', pants = '#1c1e2a', boot = '#0d0d11', hair = '#3a2a22';
  const lA = step === 1 ? -1 : 0, lB = step === 2 ? -1 : 0;
  if (dir === 'down' || dir === 'up') {
    P(5, 15 + lA, 2, 3, pants); P(4, 18 + lA, 3, 2, boot);
    P(9, 15 + lB, 2, 3, pants); P(9, 18 + lB, 3, 2, boot);
    P(4, 8, 8, 8, coat); P(3, 9, 1, 6, coatD); P(12, 9, 1, 6, coatD);
    P(4, 15, 8, 1, coatD); P(4, 12, 8, 1, coatD);
    if (dir === 'down') { P(7, 9, 2, 6, coatD); P(5, 10, 1, 1, coatL); P(10, 10, 1, 1, coatL); P(3, 14, 1, 1, skinD); P(12, 14, 1, 1, skinD); }
    else { P(7, 9, 1, 6, coatD); }
    P(5, 7, 6, 2, scarf);
    if (dir === 'down') { P(9, 8, 2, 3, scarf); P(5, 3, 6, 4, skin); P(6, 5, 1, 1, '#221c1c'); P(9, 5, 1, 1, '#221c1c'); P(5, 6, 6, 1, skinD); }
    else { P(4, 8, 2, 3, scarf); P(5, 3, 6, 4, hair); }
    P(3, 2, 10, 2, hat); P(5, 0, 6, 2, hat); P(5, 1, 6, 1, band);
  } else {
    P(6, 15 + lA, 2, 3, pants); P(6, 18 + lA, 3, 2, boot);
    P(8, 15 + lB, 2, 3, pants); P(8, 18 + lB, 3, 2, boot);
    P(5, 8, 6, 8, coat); P(4, 9, 1, 6, coatD); P(4, 14, 1, 2, coat); P(5, 15, 6, 1, coatD); P(5, 12, 6, 1, coatD);
    P(8, 9, 2, 5, coatL); P(9, 13, 1, 1, skinD);
    P(6, 7, 5, 2, scarf); P(3, 8, 3, 1, scarf); P(2, 9, 2, 1, scarf);
    P(6, 3, 5, 4, skin); P(10, 5, 1, 1, '#221c1c'); P(6, 3, 1, 3, hair); P(7, 6, 4, 1, skinD);
    P(4, 2, 10, 2, hat); P(6, 0, 6, 2, hat); P(6, 1, 6, 1, band);
  }
}

export interface Look {
  coat: string; coatD: string; skin: string; hair: string; pants?: string;
  hat?: string; hatStyle?: 'beanie' | 'none'; bun?: boolean; beard?: string; apron?: string;
  collar?: string; glasses?: boolean; wide?: boolean; long?: boolean; accent?: string;
}

export const LOOKS: Record<string, Look> = {
  viktor: { coat: '#6b4a34', coatD: '#4a3222', skin: '#d9a47c', hair: '#6b5a4a', beard: '#5a4636', apron: '#c9bfa9', wide: true },
  ilse: { coat: '#d7dde4', coatD: '#9aa3ae', skin: '#ecc9a8', hair: '#d9c07a', bun: true, glasses: true, long: true, accent: '#3d6fb8', pants: '#3a3f4f' },
  tomas: { coat: '#d9772b', coatD: '#9c4f18', skin: '#c99672', hair: '#2a2420', hat: '#2e3f5c', hatStyle: 'beanie', accent: '#e8e36a', wide: true },
  oren: { coat: '#16161c', coatD: '#0a0a0e', skin: '#e0b99a', hair: '#c9ccd4', collar: '#f2f2f2', long: true },
};

export function drawPerson(g: Ctx, ox: number, oy: number, L: Look, breath: number) {
  const P = (x: number, y: number, w: number, h: number, c: string) => { g.fillStyle = c; g.fillRect(ox + x, oy + y, w, h); };
  const b = breath ? 1 : 0;
  const pants = L.pants ?? '#1d1f29';
  if (!L.long) { P(5, 16, 2, 2, pants); P(9, 16, 2, 2, pants); }
  P(4, 18, 3, 2, '#0e0e12'); P(9, 18, 3, 2, '#0e0e12');
  const bx = L.wide ? 3 : 4, bw = L.wide ? 10 : 8;
  const bodyH = L.long ? 10 : 8;
  P(bx, 8 + b, bw, bodyH - b, L.coat);
  P(bx - 1, 9 + b, 1, 6, L.coatD); P(bx + bw, 9 + b, 1, 6, L.coatD);
  P(bx, 7 + bodyH, bw, 1, L.coatD);
  P(bx - 1, 15 + b, 1, 1, L.skin); P(bx + bw, 15 + b, 1, 1, L.skin);
  if (L.apron) { P(6, 10 + b, 4, 7 - b, L.apron); P(6, 10 + b, 4, 1, '#a89e88'); }
  if (L.accent && L.hatStyle === 'beanie') { P(bx, 12 + b, bw, 1, L.accent); }
  if (L.accent && L.bun) { P(5, 8 + b, 6, 2, L.accent); P(9, 9 + b, 2, 3, L.accent); }
  if (L.collar) { P(7, 8 + b, 2, 1, L.collar); P(7, 10 + b, 2, 1, '#2a2a33'); P(7, 12 + b, 2, 1, '#2a2a33'); }
  P(5, 3 + b, 6, 5, L.skin);
  P(5, 7 + b, 6, 1, 'rgba(0,0,0,0.18)');
  P(6, 5 + b, 1, 1, '#1a1a1a'); P(9, 5 + b, 1, 1, '#1a1a1a');
  if (L.glasses) { P(5, 5 + b, 2, 1, '#a9b6c4'); P(9, 5 + b, 2, 1, '#a9b6c4'); P(7, 5 + b, 2, 1, '#6c7886'); P(6, 5 + b, 1, 1, '#22262e'); P(9, 5 + b, 1, 1, '#22262e'); }
  if (L.beard) { P(5, 6 + b, 6, 3, L.beard); P(7, 6 + b, 2, 1, '#8a4a3a'); }
  if (L.hatStyle === 'beanie' && L.hat) {
    P(4, 1 + b, 8, 3, L.hat); P(4, 3 + b, 8, 1, '#1d2a3e'); P(7, 0 + b, 2, 1, L.hat);
  } else {
    P(5, 2 + b, 6, 2, L.hair); P(4, 3 + b, 1, 3, L.hair); P(11, 3 + b, 1, 3, L.hair);
    if (L.bun) { P(6, 0 + b, 4, 2, L.hair); }
    if (L.wide && L.beard) { P(5, 2 + b, 6, 1, L.skin); P(5, 1 + b, 6, 1, L.hair); }
  }
}
