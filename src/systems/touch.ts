/**
 * Shared mutable touch state polled by Phaser's GameScene.
 * Kept outside React so the game loop can read it at 60fps
 * without re-renders.
 */
export const touchState = {
  /** Normalised joystick vector, -1..1 on each axis. */
  x: 0,
  y: 0,
  /** True while the RUN toggle is held / enabled. */
  run: false,
  /** Queued one-shot presses, consumed by GameScene. */
  interactQueued: false,
  flashQueued: false,
};

export function queueInteract() {
  touchState.interactQueued = true;
}

export function queueFlash() {
  touchState.flashQueued = true;
}

export function consumeInteract(): boolean {
  if (!touchState.interactQueued) return false;
  touchState.interactQueued = false;
  return true;
}

export function consumeFlash(): boolean {
  if (!touchState.flashQueued) return false;
  touchState.flashQueued = false;
  return true;
}

export function setMove(x: number, y: number) {
  touchState.x = x;
  touchState.y = y;
}

export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia?.('(pointer: coarse)').matches
  );
}
