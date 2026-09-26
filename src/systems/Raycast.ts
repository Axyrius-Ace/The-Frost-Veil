import type { Point, Rect } from './types';

export interface Segment { ax: number; ay: number; bx: number; by: number; }

export function rectsToSegments(rects: Rect[]): Segment[] {
  const out: Segment[] = [];
  for (const r of rects) {
    const x2 = r.x + r.w, y2 = r.y + r.h;
    out.push({ ax: r.x, ay: r.y, bx: x2, by: r.y }, { ax: x2, ay: r.y, bx: x2, by: y2 },
      { ax: x2, ay: y2, bx: r.x, by: y2 }, { ax: r.x, ay: y2, bx: r.x, by: r.y });
  }
  return out;
}

/** Distance along a ray (unit dx,dy) to the first segment hit, capped at maxDist. */
export function rayDistance(ox: number, oy: number, dx: number, dy: number, maxDist: number, segs: Segment[]): number {
  let best = maxDist;
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    const sx = s.bx - s.ax, sy = s.by - s.ay;
    const denom = dx * sy - dy * sx;
    if (denom > -1e-9 && denom < 1e-9) continue;
    const qx = s.ax - ox, qy = s.ay - oy;
    const t = (qx * sy - qy * sx) / denom;
    if (t < 0 || t >= best) continue;
    const u = (qx * dy - qy * dx) / denom;
    if (u >= 0 && u <= 1) best = t;
  }
  return best;
}

const wrap = (a: number) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };

/** Segments whose bounding box is within `range` of the origin. */
export function nearbySegments(ox: number, oy: number, range: number, segs: Segment[]): Segment[] {
  const out: Segment[] = [];
  for (const s of segs) {
    const minX = Math.min(s.ax, s.bx) - range, maxX = Math.max(s.ax, s.bx) + range;
    const minY = Math.min(s.ay, s.by) - range, maxY = Math.max(s.ay, s.by) + range;
    if (ox >= minX && ox <= maxX && oy >= minY && oy <= maxY) out.push(s);
  }
  return out;
}

/**
 * Visibility polygon clipped to a cone. Uniform rays plus extra rays aimed just either side of
 * every corner, which is what gives crisp, correct shadow edges behind buildings and trees.
 */
export function castCone(ox: number, oy: number, angle: number, half: number, range: number, allSegs: Segment[], rays = 56): Point[] {
  const segs = nearbySegments(ox, oy, range, allSegs);
  const offs: number[] = [];
  for (let i = 0; i <= rays; i++) offs.push(-half + (2 * half * i) / rays);
  const r2 = range * range;
  for (const s of segs) {
    for (let k = 0; k < 2; k++) {
      const px = k ? s.bx : s.ax, py = k ? s.by : s.ay;
      const dx = px - ox, dy = py - oy;
      if (dx * dx + dy * dy > r2) continue;
      const a = wrap(Math.atan2(dy, dx) - angle);
      if (a > -half && a < half) offs.push(a - 0.0008, a + 0.0008);
    }
  }
  offs.sort((a, b) => a - b);
  const pts: Point[] = [];
  for (const o of offs) {
    const ang = angle + o, dx = Math.cos(ang), dy = Math.sin(ang);
    const d = rayDistance(ox, oy, dx, dy, range, segs);
    pts.push({ x: ox + dx * d, y: oy + dy * d });
  }
  return pts;
}

export function lineOfSight(ax: number, ay: number, bx: number, by: number, segs: Segment[]): boolean {
  const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy);
  if (len < 0.001) return true;
  return rayDistance(ax, ay, dx / len, dy / len, len, segs) >= len - 0.5;
}

export function angleDiff(a: number, b: number) { return wrap(a - b); }
