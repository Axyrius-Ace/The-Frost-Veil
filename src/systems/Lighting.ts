import Phaser from 'phaser';
import { DEPTH } from './constants';

/**
 * Darkness + dynamic lighting.
 * Desktop keeps the full RenderTexture lighting pass. Android/WebView devices
 * use a safe fallback: the old camera-sized RenderTexture could be composited
 * as a partial black rectangle after a resize/orientation change.
 */
export interface Seg { x1: number; y1: number; x2: number; y2: number; minX: number; minY: number; maxX: number; maxY: number }
export interface Light {
  x: number; y: number; radius: number; intensity: number; color: number;
  flicker: number; blink?: number; blinkOffset?: number; dip: number; cur: number;
  glow: Phaser.GameObjects.Image;
}
export interface Flashlight { on: boolean; x: number; y: number; angle: number; range: number; half: number; power: number }

export function raySeg(px: number, py: number, dx: number, dy: number, s: Seg): number | null {
  const sx = s.x2 - s.x1, sy = s.y2 - s.y1;
  const den = dx * sy - dy * sx;
  if (Math.abs(den) < 1e-9) return null;
  const ax = s.x1 - px, ay = s.y1 - py;
  const t = (ax * sy - ay * sx) / den;
  const u = (ax * dy - ay * dx) / den;
  return t >= 0 && u >= 0 && u <= 1 ? t : null;
}

export class Lighting {
  private scene: Phaser.Scene;
  private rt: Phaser.GameObjects.RenderTexture;
  private mask: Phaser.GameObjects.Graphics;
  private cone: Phaser.GameObjects.Graphics;
  private mobileFallback: boolean;
  private segs: Seg[] = [];
  private near: Seg[] = [];
  private rays: { x: number; y: number; d: number }[] = [];
  lights: Light[] = [];
  ambient = 0.9;
  ambientColor = 0x02050e;
  flash: Flashlight = { on: false, x: 0, y: 0, angle: 0, range: 150, half: 0.42, power: 1 };
  aura = { x: 0, y: 0, radius: 26, alpha: 0.32 };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.mobileFallback = typeof window !== 'undefined' && (
      navigator.maxTouchPoints > 0 || window.matchMedia?.('(pointer: coarse)').matches
    );
    this.rt = scene.add.renderTexture(0, 0, 640, 400).setOrigin(0, 0).setDepth(DEPTH.DARK);
    this.rt.setVisible(!this.mobileFallback);
    this.mask = scene.make.graphics({ x: 0, y: 0 }, false);
    this.cone = scene.add.graphics().setDepth(DEPTH.GLOW).setBlendMode(Phaser.BlendModes.ADD);
  }

  addOccluder(x: number, y: number, w: number, h: number) {
    const p = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
    for (let i = 0; i < 4; i++) {
      const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % 4];
      this.segs.push({ x1, y1, x2, y2, minX: Math.min(x1, x2), minY: Math.min(y1, y2), maxX: Math.max(x1, x2), maxY: Math.max(y1, y2) });
    }
  }

  addLight(o: { x: number; y: number; radius: number; intensity: number; color?: number; flicker?: number; blink?: number; blinkOffset?: number; glowScale?: number }) {
    const color = o.color ?? 0xffb060;
    const glow = this.scene.add.image(o.x, o.y, 'light')
      .setBlendMode(Phaser.BlendModes.ADD).setTint(color).setDepth(DEPTH.GLOW)
      .setScale((o.radius * (o.glowScale ?? 0.85)) / 64).setAlpha(0);
    const l: Light = { x: o.x, y: o.y, radius: o.radius, intensity: o.intensity, color, flicker: o.flicker ?? 0, blink: o.blink, blinkOffset: o.blinkOffset, dip: 0, cur: o.intensity, glow };
    this.lights.push(l);
    return l;
  }

  update(time: number) {
    const cam = this.scene.cameras.main;
    const wv = cam.worldView;
    this.near = this.segs.filter((s) => s.maxX > this.flash.x - this.flash.range && s.minX < this.flash.x + this.flash.range && s.maxY > this.flash.y - this.flash.range && s.minY < this.flash.y + this.flash.range);

    // Still animate glows on Android, but never touch the unstable RT path.
    for (const l of this.lights) {
      let k = l.intensity;
      if (l.flicker > 0) {
        if (l.dip <= 0 && Math.random() < l.flicker) l.dip = 3 + Math.floor(Math.random() * 12);
        if (l.dip > 0) { l.dip--; k *= 0.12 + Math.random() * 0.5; } else k *= 0.94 + Math.random() * 0.06;
      }
      if (l.blink) {
        const on = Math.sin((time / 1000) * (Math.PI * 2) / l.blink + (l.blinkOffset ?? 0)) > 0;
        k *= on ? 1 : 0.04;
      }
      l.cur = k;
      l.glow.setAlpha(0.15 * k);
    }

    this.cone.clear();
    if (this.mobileFallback) {
      if (this.flash.on && this.flash.power > 0.02) {
        this.cast();
        this.cone.fillStyle(0xfff1c9, 0.07 * this.flash.power);
        this.polygon(this.cone, 1);
        this.cone.fillStyle(0xfff1c9, 0.06 * this.flash.power);
        this.polygon(this.cone, 0.55);
      }
      return;
    }

    const w = Math.ceil(wv.width) + 4, h = Math.ceil(wv.height) + 4;
    if (Math.abs(this.rt.width - w) > 1 || Math.abs(this.rt.height - h) > 1) this.rt.resize(w, h);
    const ox = Math.floor(wv.x) - 2, oy = Math.floor(wv.y) - 2;
    this.rt.setPosition(ox, oy);
    this.rt.clear();
    this.rt.fill(this.ambientColor, this.ambient);
    for (const l of this.lights) {
      if (l.x + l.radius < wv.x || l.x - l.radius > wv.right || l.y + l.radius < wv.y || l.y - l.radius > wv.bottom) continue;
      this.rt.stamp('light', undefined, l.x - ox, l.y - oy, { scale: l.radius / 64, alpha: Math.min(1, l.cur), erase: true });
    }
    this.rt.stamp('light', undefined, this.aura.x - ox, this.aura.y - oy, { scale: this.aura.radius / 64, alpha: this.aura.alpha, erase: true });
    if (this.flash.on && this.flash.power > 0.02) {
      this.cast();
      this.mask.clear();
      const layers: [number, number][] = [[1, 0.3], [0.8, 0.3], [0.58, 0.35], [0.34, 0.5]];
      for (const [fr, a] of layers) { this.mask.fillStyle(0xffffff, a * this.flash.power); this.polygon(this.mask, fr); }
      this.rt.erase(this.mask, -ox, -oy);
      this.cone.fillStyle(0xfff1c9, 0.045 * this.flash.power); this.polygon(this.cone, 1);
      this.cone.fillStyle(0xfff1c9, 0.05 * this.flash.power); this.polygon(this.cone, 0.55);
    }
  }

  private cast() {
    const f = this.flash; const n = this.mobileFallback ? 48 : 84; this.rays.length = 0;
    for (let i = 0; i <= n; i++) {
      const a = f.angle - f.half + (2 * f.half * i) / n;
      const dx = Math.cos(a), dy = Math.sin(a);
      let d = f.range;
      for (const s of this.near) { const t = raySeg(f.x, f.y, dx, dy, s); if (t !== null && t < d) d = t; }
      this.rays.push({ x: dx, y: dy, d });
    }
  }

  private polygon(g: Phaser.GameObjects.Graphics, fr: number) {
    const f = this.flash; const lim = f.range * fr;
    g.beginPath(); g.moveTo(f.x, f.y);
    for (const r of this.rays) { const d = Math.min(r.d, lim); g.lineTo(f.x + r.x * d, f.y + r.y * d); }
    g.closePath(); g.fillPath();
  }

  isLit(x: number, y: number): number {
    const f = this.flash;
    if (!f.on || f.power < 0.05) return 0;
    const dx = x - f.x, dy = y - f.y; const d = Math.hypot(dx, dy);
    if (d > f.range * 0.95) return 0;
    if (d > 4) {
      const da = Math.abs(Phaser.Math.Angle.Wrap(Math.atan2(dy, dx) - f.angle));
      if (da > f.half * 0.95) return 0;
      const ux = dx / d, uy = dy / d;
      for (const s of this.near) { const t = raySeg(f.x, f.y, ux, uy, s); if (t !== null && t < d - 1) return 0; }
    }
    return f.power * (1 - (d / f.range) * 0.4);
  }
}
