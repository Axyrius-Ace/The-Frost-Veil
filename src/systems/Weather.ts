import Phaser from 'phaser';
import { DEPTH } from './constants';

/** Heavy snowfall (two parallax layers), drifting fog and wind gusts that follow the camera. */
export class Weather {
  private scene: Phaser.Scene;
  private far: Phaser.GameObjects.Particles.ParticleEmitter;
  private near: Phaser.GameObjects.Particles.ParticleEmitter;
  private fog: Phaser.GameObjects.TileSprite;
  private fogTop: Phaser.GameObjects.TileSprite;
  private indoor = false;
  private gustT = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const cam = scene.cameras.main;
    const zone = (pad: number) => ({
      getRandomPoint: (p: Phaser.Types.Math.Vector2Like) => {
        const wv = cam.worldView;
        p.x = wv.x - pad + Math.random() * (wv.width + pad * 2);
        p.y = wv.y - 30 + Math.random() * (wv.height + 30);
      },
    });
    const fade = (max: number) => ({ onEmit: () => 0, onUpdate: (_p: unknown, _k: string, t: number) => Math.sin(t * Math.PI) * max });

    this.far = scene.add.particles(0, 0, 'flake-s', {
      emitZone: { type: 'random', source: zone(80) } as any,
      lifespan: { min: 2600, max: 5200 }, speedY: { min: 16, max: 34 }, speedX: { min: -26, max: -6 },
      scale: { min: 0.6, max: 1.1 }, alpha: fade(0.85) as any, frequency: 9, quantity: 1,
    }).setDepth(DEPTH.SNOW);

    this.near = scene.add.particles(0, 0, 'flake-l', {
      emitZone: { type: 'random', source: zone(120) } as any,
      lifespan: { min: 1600, max: 3200 }, speedY: { min: 40, max: 80 }, speedX: { min: -70, max: -25 },
      scale: { min: 0.8, max: 1.4 }, alpha: fade(0.35) as any, frequency: 28, quantity: 1,
    }).setDepth(DEPTH.SNOW_TOP);

    this.fog = scene.add.tileSprite(0, 0, 640, 400, 'fog').setOrigin(0).setDepth(DEPTH.FOG).setAlpha(0.32);
    this.fogTop = scene.add.tileSprite(0, 0, 640, 400, 'fog').setOrigin(0).setDepth(DEPTH.FOG_TOP).setAlpha(0.07).setTint(0x9fb6d8);
  }

  setIndoor(indoor: boolean) {
    this.indoor = indoor;
    this.far.emitting = !indoor; this.near.emitting = !indoor;
    this.far.setVisible(!indoor); this.near.setVisible(!indoor);
    this.fog.setAlpha(indoor ? 0.08 : 0.32);
    this.fogTop.setAlpha(indoor ? 0.03 : 0.07);
  }

  update(time: number, dt: number) {
    const wv = this.scene.cameras.main.worldView;
    for (const f of [this.fog, this.fogTop]) {
      f.setPosition(Math.floor(wv.x) - 2, Math.floor(wv.y) - 2);
      if (Math.abs(f.width - wv.width - 4) > 1 || Math.abs(f.height - wv.height - 4) > 1) f.setSize(Math.ceil(wv.width) + 4, Math.ceil(wv.height) + 4);
    }
    this.fog.tilePositionX = wv.x + time * 0.008; this.fog.tilePositionY = wv.y + Math.sin(time * 0.0002) * 20;
    this.fogTop.tilePositionX = wv.x * 1.2 + time * 0.014; this.fogTop.tilePositionY = wv.y * 1.2;

    if (this.indoor) return;
    // Wind gusts push the snow sideways
    this.gustT -= dt;
    if (this.gustT <= 0) {
      this.gustT = 6 + Math.random() * 10;
      const strength = -30 - Math.random() * 70;
      this.scene.tweens.addCounter({
        from: 0, to: 1, duration: 3500, yoyo: true, ease: 'Sine.inOut',
        onUpdate: (tw) => { const v = tw.getValue() ?? 0; this.near.gravityX = strength * v; this.far.gravityX = strength * 0.5 * v; },
      });
    }
  }
}
