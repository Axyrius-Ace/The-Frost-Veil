# Frost Veil V2

## Android performance pass

- Reduced flashlight ray count on mobile while preserving occlusion and clue detection.
- Reduced repeated nearby-wall scans used by the flashlight.
- Avoided unnecessary fog TileSprite position and resize calls.
- Lowered snowfall emission rate slightly to reduce particle and battery pressure.
- Kept Phaser at 1x resolution to avoid oversized high-DPI framebuffers.

The V2 source is on `main`. Build the updated Android package with:

```bash
npm run build:apk
```
