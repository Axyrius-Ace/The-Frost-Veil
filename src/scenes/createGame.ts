import Phaser from 'phaser';
import { BootScene } from './BootScene';
import { TitleScene } from './TitleScene';
import { GameScene } from './GameScene';
import { EventBus, EV } from '../systems/EventBus';

type ManagedGame = Phaser.Game & { __frostCleanup?: () => void };

export function createGame(parent: HTMLElement) {
  const game = new Phaser.Game({
    type: Phaser.AUTO, parent, backgroundColor: '#02040b', pixelArt: true, roundPixels: true, antialias: false,
    resolution: 1, scale: { mode: Phaser.Scale.RESIZE, autoRound: true, width: parent.clientWidth || window.innerWidth, height: parent.clientHeight || window.innerHeight },
    physics: { default: 'arcade', arcade: { debug: false } }, audio: { noAudio: true }, scene: [BootScene, TitleScene, GameScene],
  }) as ManagedGame;
  const start = () => { const sm = game.scene; if (sm.isActive('Title')) sm.stop('Title'); if (sm.isActive('Game') || sm.isPaused('Game')) sm.getScene('Game').scene.restart(); else sm.start('Game'); };
  const title = () => { const sm = game.scene; if (sm.isActive('Game') || sm.isPaused('Game')) sm.stop('Game'); if (!sm.isActive('Title')) sm.start('Title'); };
  EventBus.on(EV.START_GAME, start); EventBus.on(EV.TO_TITLE, title);
  game.__frostCleanup = () => { EventBus.off(EV.START_GAME, start); EventBus.off(EV.TO_TITLE, title); game.destroy(true); };
  return game;
}
