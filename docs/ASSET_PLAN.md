# FROST VEIL: Pixel-Art & Audio Asset Plan

Every asset currently ships **procedurally** (`src/assets/textures.ts`, `src/systems/audio.ts`), so the game is complete and playable as-is. This document is the production plan for replacing them with hand-authored art and audio without touching game code: keep the **texture keys** and **sizes**.

## Art direction
- **Resolution:** native 1 px = 1 world unit, rendered with integer camera zoom (×2–×5 depending on window height; ~480×270 visible at 1080p). `pixelArt: true`, nearest-neighbour everywhere.
- **Perspective:** top-down 3/4 (roofs and fronts visible), y-sorted depth.
- **Palette (night):** snow `#dfe8f5 / #b9c7dc / #f4f8fd`, road slush `#707a92`, ice `#96bede`, darkness `#02050e`. Warm accents only from light sources: window `#ffae48 → #ffd98a`, lamp `#ffcf7a`, fire `#ff7a2a`. Blood-red `#c43a3a` reserved for evidence and UI emphasis.
- **Rule:** textures are painted *fully lit*. Night comes from the lighting system (a darkness RenderTexture plus radial light stamps). Never bake darkness into sprites.

## Sprite list (key · size · notes)
| Key | Size | Notes |
|---|---|---|
| `detective` | 48×96 sheet, 16×24 frames | frames `down-0..2`, `left-0..2`, `right-0..2`, `up-0..2` (0 = idle, 1/2 = steps). Tan trench, fedora, red scarf |
| `npc-halvorsen/brandt/henrik/oskar/jonah` | 16×24 | idle, facing down (breathing is a tween). Future: 2-frame idle + 4-dir |
| `body` | 28×18 | victim lying in snow, frost speckles |
| `portrait-<id>` | 48×48 | dialogue/notebook portraits, shown at ×2–×3. Cold rim light on the left |
| `ev-<evidenceId>` | 24×24 | 11 evidence icons, also drawn at ×0.5 in the world |
| `bld-<id>` | footprint w×h (+`extraTop`) | 14 buildings. Lit window positions feed the lighting (keep window rows ~55% down) |
| `tree-a/b/c`, `stump` | 30×48, 24×38, 36×58, 14×10 | snow-laden pines, origin bottom-centre |
| `lamp`, `lamp-dead` | 12×46 | light emitted at base and head |
| `monument, police-car, plow, bench, mailbox, notice, signpost, crate, barrel` | see generator | props, origin bottom-centre |
| `floor-wood/tile/stone` | 32×32 tileable | interiors |
| `wall-post/clinic/inn/church` | 32×28 tileable | interior back walls |
| furniture: `counter shelf desk stove cabinet bed curtain table chair bar fireplace pew altar candle hymnboard organ rug doormat` | see generator | origin top-left, collision = lower 55% |
| `ground` | 1120×800 | town ground: snow, roads with tyre tracks, cobbled plaza, ice patches. Can be swapped for a Tiled tilemap |
| `light` | 128×128 | radial white gradient used for ALL light stamps and glows. Don't replace unless you're changing the falloff |
| `fog` | 256×256 tileable | alpha noise |
| `flake-s`, `flake-l`, `glint`, `battery`, `bootprint`, `step` | tiny | particles & pickups |
| `title-bg` | 320×180 | title panorama, scaled to cover |

### Animation roadmap for commercial release
Detective: 6-frame walk ×4 dirs, 4-frame breath idle, flashlight-raise overlay, shiver idle after 10 s. NPCs: 4-frame idle with personal tics (Brandt adjusts glasses, Oskar sways, Jonah rubs his hands, Henrik polishes a glass). FX: breath-vapour puffs, snow swirls around lamps, chimney smoke, ember particles by fireplaces.

### How to swap in PNGs
1. Put files in `public/assets/…`.
2. In `BootScene`, add a `preload()` that calls `this.load.image('bld-post', 'assets/bld-post.png')` (or `this.load.spritesheet('detective', …, { frameWidth: 16, frameHeight: 24 })`, then add named frames or update the anims in `GameScene.createAnims`).
3. In `generateTextures`, skip any key that `scene.textures.exists(key)` already provides.
4. For windows on custom building art, set `litWindows` manually in `data/world.ts`.

## Audio plan
| Cue | Current (procedural) | Final asset spec |
|---|---|---|
| Wind | band-passed noise, 2 LFOs, whistle layer, low rumble. Low-passed indoors | 3 looping stems (calm/gust/howl), −18 LUFS, crossfaded by exposure |
| Footsteps | snow crunch / ice tick / wood thud | 8 variations per surface, randomised pitch ±5% |
| Ice cracking | clustered filtered clicks + falling sine | 6 one-shots |
| Church bells | inharmonic additive bell, 3–5 tolls every 80–150 s, distant LPF + reverb | recorded bell, heavy convolution with a mountain IR |
| Piano | sparse A-minor phrases over a low bass, 26–68 s of silence between them | 12 short felt-piano phrases, played by the same scheduler |
| UI / evidence / deduction | synthesized chimes | keep the tonal centre (A) |

Deliberate silence is a design pillar: never layer music under dialogue, and let wind carry the empty stretches.
