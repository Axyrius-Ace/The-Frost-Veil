import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { TitleScene } from '../scenes/TitleScene';
import { WorldScene } from '../scenes/WorldScene';

export const VIEW_W = 480;
export const VIEW_H = 270;

let game: Phaser.Game | null = null;
let resizeHooked = false;

function hookResize() {
  if (resizeHooked) return;
  resizeHooked = true;
  let t = 0;
  const refresh = () => {
    window.clearTimeout(t);
    // Wait out the rotation animation / address-bar slide before re-fitting.
    t = window.setTimeout(() => {
      try { game?.scale.refresh(); } catch { /* noop */ }
    }, 120);
  };
  window.addEventListener('resize', refresh);
  window.addEventListener('orientationchange', refresh);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', refresh);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
}

export function createGame(parent: HTMLElement) {
  if (game) return game;
  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: VIEW_W,
    height: VIEW_H,
    backgroundColor: '#05070f',
    pixelArt: true,
    roundPixels: true,
    disableContextMenu: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      autoRound: true,
      width: VIEW_W,
      height: VIEW_H,
    },
    render: { antialias: false, pixelArt: true },
    scene: [BootScene, TitleScene, WorldScene],
    audio: { noAudio: true },
    fps: { target: 60 },
  });
  hookResize();
  // Fit once the canvas exists (fonts / chrome may shift layout on first paint).
  window.setTimeout(() => { try { game?.scale.refresh(); } catch { /* noop */ } }, 300);
  return game;
}

export function startWorld() {
  if (!game) return;
  const sm = game.scene;
  if (sm.isActive('Title')) sm.stop('Title');
  if (sm.isActive('World') || sm.isPaused('World')) sm.stop('World');
  sm.start('World');
}

export function showTitle() {
  if (!game) return;
  const sm = game.scene;
  if (sm.isActive('World')) sm.stop('World');
  if (!sm.isActive('Title')) sm.start('Title');
}

export function destroyGame() {
  game?.destroy(true);
  game = null;
}
