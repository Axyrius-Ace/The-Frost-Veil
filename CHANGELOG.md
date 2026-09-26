# FROST VEIL — Changelog

Every released version appears in the GitHub **Releases** list
(next to all older ones), each with its own APK to download.

## Unreleased (on `main`)
- Next development.
- Night pass: deeper darkness outdoors, dimmer lamp pools/glows, smaller
  flashlight aura, calmer snow/fog above the darkness, moonlit ground.
- Interiors get a dark surround (no raw black void frame); phone vignette
  softened and quest HUD compacted on small screens.
- Phone navigation: modals scroll, pause menu fits the screen, all menu and
  back buttons are finger-sized.
- Android fullscreen immersion: status bar and nav buttons hidden (swipe
  from an edge to reveal), notch edge-to-edge.

## v2.0 — V2
- Virtual joystick (listeners attach on entering play mode, dead zone,
  second-finger guard) so the player moves on touch devices.
- Landscape: browser version requests landscape lock on game start and shows
  a "rotate your phone" hint in portrait; APK locked via AndroidManifest.
- Flashlight beam rendered from the post-physics player position, faster
  beam tracking while moving, touch aim only while the finger is down.
- Android APK build via Capacitor + cloud workflow.
- One-click release system (`release.bat`) with automatic Releases + APK.

## v1.0 — V1 classic
- Original PC version snapshot + mobile touch controls and rotation fix.
- Branch: `v1-classic`, tag: `v1.0`.

## How to release a new version
1. Double-click `release.bat`.
2. Type the version number, e.g. `2.0`.
3. Wait ~5 minutes, then open GitHub → **Releases**.
   Your new version sits at the top, older ones below it.
