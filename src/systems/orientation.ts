/**
 * Landscape handling.
 *
 * - Inside the Android APK the screen is locked via AndroidManifest
 *   (sensorLandscape), so this is purely for the browser version.
 * - Browsers only allow an orientation lock right after the user taps
 *   something, so call lockLandscape() from menu button handlers.
 * - Where locking is unsupported (iOS Safari), the RotateHint overlay tells
 *   the player to turn the phone instead.
 */
export function lockLandscape() {
  try {
    const orientation = window.screen?.orientation as
      | { lock?: (o: 'landscape') => Promise<void> }
      | undefined;
    if (orientation?.lock) {
      const p = orientation.lock('landscape');
      if (p && typeof p.catch === 'function') p.catch(() => {});
    }
  } catch {
    /* Unsupported browser — the rotate hint covers it. */
  }
}

export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  if ('ontouchstart' in window) return true;
  if (navigator.maxTouchPoints > 0) return true;
  try {
    return window.matchMedia('(pointer: coarse)').matches;
  } catch {
    return false;
  }
}
