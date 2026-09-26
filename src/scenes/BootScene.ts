import Phaser from 'phaser';
import { generateTextures } from '../assets/textures';
import { setState } from '../systems/store';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  create() {
    generateTextures(this);
    setState({ booted: true });
    this.scene.start('Title');
  }
}
