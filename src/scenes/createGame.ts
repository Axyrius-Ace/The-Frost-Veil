import Phaser from 'phaser';
import { BootScene } from './BootScene';
import { TitleScene } from './TitleScene';
import { GameScene } from './GameScene';
import { EventBus, EV } from '../systems/EventBus';

export function createGame(parent: HTMLElement) {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#02040b',
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    // Prevent high-DPI Android screens from creating oversized WebGL targets.
    // This also removes the fractional compositing seams visible after resize.
    resolution: 1,
    scale: { mode: Phaser.Scale.RESIZE, autoRound: true, width: parent.clientWidth || window.innerWidth, height: parent.clientHeight || window.innerHeight },
    physics: { default: 'arcade', arcade: { debug: false } },
    audio: { noAudio: true },
    scene: [BootScene, TitleScene, GameScene],
  });

  EventBus.on(EV.START_GAME, () => {
    const sm = game.scene;
    if (sm.isActive('Title')) sm.stop('Title');
    if (sm.isActive('Game') || sm.isPaused('Game')) sm.getScene('Game').scene.restart();
    else sm.start('Game');
  });
  EventBus.on(EV.TO_TITLE, () => {
    const sm = game.scene;
    if (sm.isActive('Game') || sm.isPaused('Game')) sm.stop('Game');
    if (!sm.isActive('Title')) sm.start('Title');
  });
  return game;
}
