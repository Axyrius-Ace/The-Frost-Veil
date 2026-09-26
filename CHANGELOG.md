# FROST VEIL — Changelog

Every released version appears in the GitHub **Releases** list
(next to all older ones), each with its own APK to download.

## Unreleased (on `main`)
- Next development.
- Fix: virtual joystick listeners now attach when entering play mode (the
  stick was visible but dead, so the player couldn't move on touch devices),
  plus stick dead zone and second-finger guard.
- Landscape: browser version requests landscape lock on game start and shows
  a "rotate your phone" hint in portrait (the APK was already locked via
  AndroidManifest).

## v3.0 — V3
- Everything from V2 (touch joystick, landscape/rotation handling, Android build).
- Fix: flashlight beam rendered from the post-physics player position, faster
  beam tracking while moving, and touch aim only while the finger is down —
  the light stays glued to the player instead of trailing behind.

## v1.0 — V1 classic
- Original PC version snapshot + mobile touch controls and rotation fix.
- Branch: `v1-classic`, tag: `v1.0`.

## How to release a new version
1. Double-click `release.bat`.
2. Type the version number, e.g. `2.0`.
3. Wait ~5 minutes, then open GitHub → **Releases**.
   Your new version sits at the top, older ones below it.
