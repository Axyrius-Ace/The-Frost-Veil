import Phaser from 'phaser';
import type { AreaDef, LampDef } from '../data/areas';
import type { Point } from './types';

/**
 * Screen-space light map. Each frame we paint a night-blue darkness layer, then punch light
 * out of it (destination-out) for lamps, lit windows and the flashlight's visibility polygon,
 * and finally tint those holes with warm / cold colour. The result is uploaded as a WebGL
 * texture and drawn above the world.
 */
export class Lighting {
  private tex: Phaser.Textures.CanvasTexture;
  private ctx: CanvasRenderingContext2D;
  readonly w: number; readonly h: number;

  constructor(scene: Phaser.Scene, w: number, h: number, depth: number) {
    this.w = w; this.h = h;
    if (scene.textures.exists('lightmap')) scene.textures.remove('lightmap');
    this.tex = scene.textures.createCanvas('lightmap', w, h) as Phaser.Textures.CanvasTexture;
    this.ctx = this.tex.getContext();
    scene.add.image(0, 0, 'lightmap').setOrigin(0).setScrollFactor(0).setDepth(depth);
  }

  private lampFactor(L: LampDef, t: number) {
    if (!L.flicker) return 0.94 + 0.06 * Math.sin(t * 0.002 + L.x);
    const n = Math.sin(t * 0.0131 + L.x) * Math.sin(t * 0.0317 + L.y * 1.7);
    if (n > 0.82) return 0.2 + 0.2 * Math.random();
    return 0.82 + 0.14 * Math.sin(t * 0.05 + L.x) + (L.tint === 'fire' ? 0.06 * Math.sin(t * 0.021) : 0);
  }

  private hole(x: number, y: number, r: number, a0: number, aMid: number) {
    const c = this.ctx;
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(0,0,0,${a0})`); g.addColorStop(0.45, `rgba(0,0,0,${aMid})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  }
  private tint(x: number, y: number, r: number, rgb: string, a: number) {
    const c = this.ctx;
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  }

  render(cam: Phaser.Cameras.Scene2D.Camera, area: AreaDef, cone: Point[] | null, ox: number, oy: number, beam: number, range: number, t: number) {
    const c = this.ctx, sx = cam.scrollX, sy = cam.scrollY, W = this.w, H = this.h;
    c.globalCompositeOperation = 'source-over';
    c.clearRect(0, 0, W, H);
    c.fillStyle = area.interior ? `rgba(6,6,14,${area.darkness})` : `rgba(3,7,20,${area.darkness})`;
    c.fillRect(0, 0, W, H);

    const lamps = area.lamps.map(L => {
      const f = this.lampFactor(L, t);
      return { L, f, x: L.x - sx, y: (L.post ? L.y - 22 : L.y) - sy };
    }).filter(l => l.x > -l.L.r && l.x < W + l.L.r && l.y > -l.L.r && l.y < H + l.L.r);
    const glows = area.glows.map(g => ({ x: g.x - sx, y: g.y - sy })).filter(g => g.x > -40 && g.x < W + 40 && g.y > -40 && g.y < H + 40);
    const px = ox - sx, py = oy - sy;

    c.globalCompositeOperation = 'destination-out';
    for (const l of lamps) this.hole(l.x, l.y, l.L.r, 0.95 * l.f, 0.55 * l.f);
    for (const g of glows) this.hole(g.x, g.y + 8, 30, 0.75, 0.3);
    this.hole(px, py, 30, 0.4, 0.14);
    if (cone && cone.length > 1 && beam > 0) {
      c.beginPath(); c.moveTo(px, py);
      for (const p of cone) c.lineTo(p.x - sx, p.y - sy);
      c.closePath();
      const g = c.createRadialGradient(px, py, 2, px, py, range);
      g.addColorStop(0, `rgba(0,0,0,${beam})`); g.addColorStop(0.5, `rgba(0,0,0,${0.9 * beam})`);
      g.addColorStop(0.85, `rgba(0,0,0,${0.45 * beam})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fill();
    }

    c.globalCompositeOperation = 'source-over';
    for (const l of lamps) {
      const rgb = l.L.tint === 'cold' ? '170,200,255' : l.L.tint === 'fire' ? '255,120,40' : '255,160,70';
      this.tint(l.x, l.y, l.L.r * 0.9, rgb, (l.L.tint === 'cold' ? 0.1 : 0.2) * l.f);
    }
    for (const g of glows) this.tint(g.x, g.y + 6, 26, '255,150,60', 0.22);
    if (cone && cone.length > 1 && beam > 0) {
      c.beginPath(); c.moveTo(px, py);
      for (const p of cone) c.lineTo(p.x - sx, p.y - sy);
      c.closePath(); c.fillStyle = `rgba(215,230,255,${0.07 * beam})`; c.fill();
    }
    this.tex.refresh();
  }
}
