import Phaser from 'phaser';
import { generateAllTextures } from '../assets/TextureFactory';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  create() {
    generateAllTextures(this);
    this.scene.start('Title');
  }
}
