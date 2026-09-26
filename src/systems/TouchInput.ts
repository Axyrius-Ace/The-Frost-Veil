/**
 * Shared touch state between the React overlay (virtual joystick / buttons)
 * and the Phaser WorldScene (polled every frame).
 *
 * Kept outside React so there is zero re-render cost while the stick moves.
 */
export const touchInput = {
  /** Normalised movement vector from the virtual stick, -1..1 on each axis. */
  moveX: 0,
  moveY: 0,
  /** True while the stick is deflected. */
  active: false,
  /** Latched run toggle from the RUN button. */
  run: false,

  _interact: false,
  _flash: false,

  setMove(x: number, y: number) {
    this.moveX = x;
    this.moveY = y;
    this.active = x !== 0 || y !== 0;
  },

  clearMove() {
    this.moveX = 0;
    this.moveY = 0;
    this.active = false;
  },

  queueInteract() {
    this._interact = true;
  },

  consumeInteract(): boolean {
    if (!this._interact) return false;
    this._interact = false;
    return true;
  },

  queueFlash() {
    this._flash = true;
  },

  consumeFlash(): boolean {
    if (!this._flash) return false;
    this._flash = false;
    return true;
  },
};

export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}
