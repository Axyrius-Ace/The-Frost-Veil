import Phaser from 'phaser';

/** Living backdrop behind the React title menu: the town from the ridge, snow and drifting fog. */
export class TitleScene extends Phaser.Scene {
  private fogA!: Phaser.GameObjects.TileSprite;
  private fogB!: Phaser.GameObjects.TileSprite;
  private glow!: Phaser.GameObjects.Image;

  constructor() { super('Title'); }

  create() {
    const W = 480, H = 270;
    this.add.image(0, 0, 'title_bg').setOrigin(0);
    this.fogA = this.add.tileSprite(0, 150, W, 120, 'fog').setOrigin(0).setAlpha(0.35);
    this.add.particles(0, 0, 'flake', {
      x: { min: -40, max: W + 40 }, y: -6, lifespan: 9000, speedY: { min: 14, max: 34 }, speedX: { min: -22, max: -4 },
      alpha: { min: 0.3, max: 0.8 }, scale: { min: 0.5, max: 1 }, frequency: 45, quantity: 1, advance: 9000,
    });
    this.add.image(400, 262, 'lamp').setOrigin(0.5, 1).setScale(2);
    this.glow = this.add.image(400, 186, 'glow').setScale(2.6).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.7);
    this.add.particles(0, 0, 'flake_big', {
      x: { min: -40, max: W + 40 }, y: -6, lifespan: 6000, speedY: { min: 40, max: 70 }, speedX: { min: -50, max: -20 },
      alpha: { min: 0.5, max: 0.9 }, frequency: 160, quantity: 1, advance: 6000,
    });
    this.fogB = this.add.tileSprite(0, 0, W, H, 'fog').setOrigin(0).setAlpha(0.14);
    this.add.image(0, 0, 'vignette').setOrigin(0);
    this.cameras.main.fadeIn(1500, 0, 0, 0);
  }

  update(t: number) {
    this.fogA.tilePositionX = t * 0.012;
    this.fogB.tilePositionX = t * 0.02; this.fogB.tilePositionY = t * 0.004;
    const n = Math.sin(t * 0.013) * Math.sin(t * 0.029);
    this.glow.setAlpha(n > 0.85 ? 0.25 : 0.65 + 0.05 * Math.sin(t * 0.01));
  }
}
