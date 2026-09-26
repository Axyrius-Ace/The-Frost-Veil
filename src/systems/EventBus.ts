import Phaser from 'phaser';
/** Bridge between React UI and Phaser scenes. */
export const EventBus = new Phaser.Events.EventEmitter();
export const EV = { START_GAME: 'start-game', TO_TITLE: 'to-title' } as const;
