import Phaser from 'phaser';

/** Atmospheric backdrop behind the React title menu: pixel mountain town, snowfall, drifting fog, flickering lights. */
export class TitleScene extends Phaser.Scene {
  private bg!: Phaser.GameObjects.Image;
  private fog!: Phaser.GameObjects.TileSprite;
  private flicker!: Phaser.GameObjects.Rectangle;
  constructor() { super('Title'); }

  create() {
    this.cameras.main.setBackgroundColor('#02040b');
    this.bg = this.add.image(0, 0, 'title-bg').setOrigin(0.5);
    this.flicker = this.add.rectangle(0, 0, 10, 10, 0x000000, 0).setOrigin(0);
    this.fog = this.add.tileSprite(0, 0, 10, 10, 'fog').setOrigin(0).setAlpha(0.22).setTint(0xaec4e4);
    const scr = () => ({ getRandomPoint: (p: Phaser.Types.Math.Vector2Like) => { p.x = Math.random() * (this.scale.width + 300) - 100; p.y = Math.random() * this.scale.height - 40; } });
    const fade = (max: number) => ({ onEmit: () => 0, onUpdate: (_p: unknown, _k: string, t: number) => Math.sin(t * Math.PI) * max });
    this.add.particles(0, 0, 'flake-s', { emitZone: { type: 'random', source: scr() } as any, lifespan: { min: 3000, max: 6000 }, speedY: { min: 30, max: 70 }, speedX: { min: -60, max: -20 }, scale: { min: 1.5, max: 3 }, alpha: fade(0.8) as any, frequency: 14 });
    this.add.particles(0, 0, 'flake-l', { emitZone: { type: 'random', source: scr() } as any, lifespan: { min: 1500, max: 3000 }, speedY: { min: 90, max: 160 }, speedX: { min: -150, max: -60 }, scale: { min: 2, max: 4 }, alpha: fade(0.5) as any, frequency: 60 });
    this.layout();
    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.layout, this));
    this.cameras.main.fadeIn(1500, 0, 0, 0);
  }

  private layout() {
    const { width: w, height: h } = this.scale;
    this.bg.setPosition(w / 2, h / 2).setScale(Math.max(w / 320, h / 180));
    this.fog.setSize(w, h); this.fog.setTileScale(3, 3);
    this.flicker.setSize(w, h);
  }

  update(time: number) {
    this.fog.tilePositionX = time * 0.01; this.fog.tilePositionY = Math.sin(time * 0.0003) * 10;
    this.flicker.fillAlpha = Math.random() < 0.015 ? 0.25 : 0;
  }
}
