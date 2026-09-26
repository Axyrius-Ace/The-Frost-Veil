# FROST VEIL: Pixel-Art Asset Plan

The shipped build generates **every texture procedurally** at boot (`TextureFactory.ts` + `pixelArt.ts`),
so the game runs with zero binary assets. This document is the production plan for replacing that
programmer art with hand-authored sprites without touching gameplay code: keep the same texture keys
and sizes and swap `generateAllTextures()` for a Phaser `load.spritesheet` / `load.image` pass in `BootScene`.

## Global rules
- **Native resolution:** 480×270, integer-scaled (FIT). Never sub-pixel positioned art.
- **Tile unit:** 16 px. Characters 16×20 on a 16 px footprint.
- **Palette (32 colours max):** night blues `#05070f #0a1122 #111c33 #1b2e4c`, snow `#eef3fa #d6e1ef #b4c3d8`,
  ice `#4b5d73 #627891 #8ea5bd`, warm light `#ffb45a #ffd78e #fff0c8`, wood `#3e2819 #5a3b2b #7a5234`,
  blood accent `#94292f #a3262b`, cold light `#aac8ff`.
- **Lighting is runtime-only.** Paint sprites flat-lit (neutral, slightly cool). No baked glow, the light map adds it.
- **Outlines:** 1 px darker-hue selective outline, never pure black.
- **Snow on top edges** of everything (roofs, lamps, signs, sills).

## Characters (`16×20`, origin bottom-center)
| Key | Frames | Notes |
|---|---|---|
| `detective` | 9: down idle/stepA/stepB, up ×3, side ×3 (left = flipX) | Trench coat, brimmed hat, red scarf trailing in wind. Upgrade path: 4-frame walk + idle breath + flashlight-arm variant. |
| `npc_viktor` | 2 (breath) | Wide, apron, beard. Add 2-frame "polishing glass" idle. |
| `npc_ilse` | 2 | White coat, blonde bun, round glasses, blue scarf accent. Add "writing" idle. |
| `npc_tomas` | 2 | Orange hi-vis parka, navy beanie. Add "wrench" idle. |
| `npc_oren` | 2 | Black cassock, white collar, silver hair. Add "candle" idle. |
| Portraits | 1 each at 18×15 (rendered ×7) | Upgrade to 64×64 painted-pixel busts with 3 expressions (neutral / tense / broken). |

## Environment
| Key | Size | Notes |
|---|---|---|
| `ground_town` | 1280×800 | Snow noise, drifts, icy roads with tyre ruts, cobbled plaza, trodden paths. Upgrade to 16 px tileset + Tiled map. |
| `bld_*` | per building | Snow-capped roofs, icicles, warm lit windows (positions in `areas.ts` drive the glow). |
| `ground_<interior>` | 320×224 | Floor, back wall with frosted windows, furniture baked in. |
| `pine` | 24×40 | 3 tiers, snow-laden. Add 2 variants + wind sway (2 frames). |
| `lamp` | 10×44 | Iron post, lantern head. Light radius set in data. |
| `fountain`, `car`, `sign` | 56×44 / 40×26 / 16×20 | Frozen props. |

## Clues & pickups
`clue_body 24×12`, `clue_scarf 12×7`, `prints 8×10`, `clue_vial 5×9`, `clue_ledger 12×9`, `clue_letter 12×7`,
`clue_log 12×9`, `battery 6×10`, `sparkle 7×7` (hidden-clue glint, visible only in the beam).

## FX
`flake 2×2`, `flake_big 3×3`, `footprint 3×4`, `fog 256×256` tileable soft noise, `vignette 480×270`, `glow 64×64`.

## Audio plan (currently synthesised in `AudioSystem.ts`)
| Cue | Current | Recorded replacement |
|---|---|---|
| Wind | two filtered-noise beds + LFO + gusts | 3 stereo loops (calm / gusting / interior muffled), crossfaded |
| Snow footsteps | noise grains | 8 snow + 6 ice + 6 wood variations |
| Ice cracking | click trains + pitch-drop | 5 one-shots |
| Church bells | 9-partial inharmonic additive bell | distant bell recording with long tail |
| Piano | synth phrases in A minor, 40-95 s silences | 6 solo piano phrases, same scheduler |
