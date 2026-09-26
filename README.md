# ❄ FROST VEIL

*A 2D pixel-art detective mystery set on one endless snowy night.*

Hollowmere is a mountain town buried under a blizzard. The pass is closed, the phone lines are down,
and the postmistress has just been found frozen beside the fountain. The doctor says hypothermia.
Your flashlight says otherwise.

---

## ▶ One-click run (Windows)

1. Install **Node.js LTS** (18 or newer) from https://nodejs.org (one time only).
2. Double-click **`run.bat`**.

It installs dependencies on first launch, starts the Vite dev server, waits until it's up, and opens
Google Chrome at **http://localhost:5173** (falls back to your default browser if Chrome isn't found).

**macOS / Linux:** `npm install && npm run dev`, then open http://localhost:5173.

**Production build:** `npm run build` outputs a static site in `dist/` you can host anywhere.

## 🎮 Controls

| Input | Action |
|---|---|
| WASD / Arrow keys | Walk |
| Shift | Run |
| Mouse | Aim the flashlight |
| **F** / Right click | Flashlight on / off |
| E / Space | Interact, talk, advance dialogue |
| 1–9 | Choose a dialogue option |
| N / Tab | Detective's notebook |
| B | Investigation board |
| Esc | Close panel / pause menu (save, load, audio, controls) |

## 🔦 How to play

- **The flashlight is your best tool.** Its beam is a real ray-cast cone: buildings, trees and furniture cast shadows.
- **The battery drains** (about four minutes of beam). Batteries are hidden around town and inside buildings (+40% each). Under 15% the beam starts to stutter.
- **Some clues exist only in the beam.** Puncture marks, boot-print trails, things that rolled under furniture: sweep dark corners.
- **Talk to everyone.** New dialogue options (marked **PRESS**) unlock as you gather evidence.
- **Connect clues on the Investigation Board.** Click one card, then another. Right pairs become deductions that implicate or clear suspects. Wrong pairs are counted.
- **Accuse** once you have at least two deductions. What you've proven decides which of **six endings** you get.

<details><summary>Spoiler-free hint</summary>A killing that looks like an accident usually needs three things proven: how, a lie, and why.</details>

## ✨ Feature list

- **Phaser 3 world** in WebGL at a crisp 480×270, integer-scaled to any desktop window.
- **Dynamic lighting:** screen-space light map with ray-cast flashlight cone (corner rays for crisp shadows), flickering street lamps, warm window glow, firelight and cold clinic light.
- **Atmosphere:** two snowfall layers (the back layer only shows where light falls, so flakes glitter in your beam), parallax fog, vignette, footprints that slowly fill in, icy roads.
- **Branching dialogue** with evidence-gated options, flags, journal entries and typewriter text.
- **Detective's notebook:** evidence by category, people with live suspicion status, auto journal, free-text notes.
- **Investigation board:** draggable cork-board cards, animated red string, deduction log, accusation.
- **Six endings**, including a true ending that needs all three core deductions.
- **Save / load:** three manual slots plus autosave (on new evidence, deductions, room changes and dialogue end), stored in `localStorage`.
- **Procedural audio** (Web Audio): howling wind with gusts, snow and ice footsteps, ice cracking, distant church bells, a melancholic piano that plays rarely and leaves long silences. Muffled indoors.
- **Zero binary assets:** every sprite and sound is generated at runtime.

## 🧱 Architecture

```
frost-veil/
├─ run.bat                 one-click launcher (install → dev server → Chrome)
├─ index.html · vite.config.ts · tsconfig.json · package.json
├─ public/favicon.svg
└─ src/
   ├─ main.tsx · App.tsx   React root; overlays UI on top of the Phaser canvas
   ├─ assets/
   │  ├─ pixelArt.ts       pure canvas pixel routines (characters, palette, RNG)
   │  ├─ TextureFactory.ts builds every Phaser texture at boot
   │  └─ ASSET_PLAN.md     hand-authored art & audio replacement plan
   ├─ scenes/
   │  ├─ BootScene.ts      texture generation
   │  ├─ TitleScene.ts     animated backdrop for the title menu
   │  └─ WorldScene.ts     exploration: movement, collision, flashlight, clues, doors
   ├─ systems/
   │  ├─ GameStore.ts      single source of truth (React ⇄ Phaser), useSyncExternalStore
   │  ├─ SaveSystem.ts     versioned localStorage slots + settings
   │  ├─ Lighting.ts       light-map renderer
   │  ├─ Raycast.ts        visibility-polygon cone, line of sight
   │  ├─ DialogueSystem.ts dialogue runtime (conditions, effects)
   │  ├─ Deduction.ts      clue pairing, suspect status, ending resolution
   │  ├─ AudioSystem.ts    procedural soundscape
   │  ├─ PhaserGame.ts     game bootstrap + scene switching
   │  └─ types.ts
   ├─ data/
   │  ├─ story.ts          evidence, suspects, deductions, endings, intro
   │  ├─ dialogues.ts      dialogue trees
   │  └─ areas.ts          town + interiors: buildings, lamps, clues, doors
   ├─ components/          GameCanvas, Portrait, Typewriter, SaveSlots
   └─ ui/                  HUD, DialogueBox, Notebook, InvestigationBoard, AccuseModal,
                           InspectModal, PauseMenu, TitleScreen, EndingScreen, Toast, styles.css
```

**Data flow:** Phaser owns the simulation (position, battery, cone). Anything the UI needs goes into `GameStore`.
React panels read the store and call store/system functions. While any panel is open (`ui !== null`)
the world freezes input and battery drain. Per-frame values are written with `store.silent()` so React only
re-renders when something visible changes.

**Adding content:** new clues go in `story.ts` (evidence + deductions), placement in `areas.ts`, new conversation
branches in `dialogues.ts`. No engine changes needed.

## 🛠 Troubleshooting

- **`run.bat` closes instantly / "Node.js was not found"**: install Node LTS and reopen the file.
- **Port 5173 in use**: close the other dev server (the port is fixed so Chrome opens the right page).
- **No sound**: browsers only allow audio after a click, so it starts when you press *New Investigation* or *Continue*.
- **Reset progress**: DevTools → Application → Local Storage → delete the `frostveil.*` keys.
