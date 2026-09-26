# FROST VEIL

*A Hollowpine Mystery.* A 2D pixel-art detective game set on one endless, snowbound night.
You play a detective stuck in a buried mountain town. The postmistress is dead under the town clock, and the only light you can count on is the flashlight in your hand.

**Stack:** React 18 + TypeScript + Vite 5 + Phaser 3.80 (WebGL/Canvas). Runs entirely in the browser.

---

## ▶ One-click run (Windows)

1. Install **Node.js 18+** once from https://nodejs.org (the launcher opens that page for you if Node is missing).
2. Double-click **`run.bat`**.

`run.bat` will:
1. Install dependencies on first launch only (`npm install`),
2. Start the Vite dev server on `http://localhost:5173`,
3. Wait until the server responds, then open **Google Chrome** at that address (it falls back to your default browser if Chrome isn't found).

On macOS/Linux, run `./run.sh` instead. To do it by hand: `npm install` then `npm run dev`. `npm run build` gives you a static `dist/` you can host anywhere.

> The first `npm install` needs internet access. After that the game is fully offline: every sprite and sound is generated at runtime, so there are no binary assets to download.

---

## Controls

| Key | Action |
|---|---|
| WASD / Arrows | Walk |
| Shift | Run |
| Mouse | Aim flashlight |
| **F** / Right-click | Flashlight on/off |
| E | Examine / Talk / Enter |
| J / Tab | Detective notebook |
| B | Investigation board |
| 1–9 / Space | Dialogue choices / advance |
| Esc / P | Pause (save, load, volume) |
| M | Mute |

---

## Features

- **Flashlight:** a ray-cast cone that casts real shadows off walls, furniture and buildings. It uses a battery that slowly drains (about 4 minutes from full), flickers and loses range below 15%, and recharges from the 9 batteries hidden around town. **Hidden clues and the killer's boot trail only appear inside the beam.**
- **Atmosphere:** heavy two-layer parallax snowfall pushed around by wind gusts, drifting fog, flickering and dead street lamps, warm orange windows, a blinking police cruiser, footprints that fill back in with snow, and a cold blue night palette.
- **Investigation:** 11 pieces of evidence (5 of them hidden), 5 characters with branching dialogue gated by the evidence, flags and deductions you hold, a notebook (Evidence / People / Journal / Deductions), and a drag-and-drop **corkboard** where you tie cards together with red string to form deductions. One of them is a red herring that later evidence can contradict.
- **6 endings:** the true ending, a "right suspect, weak case" ending, three wrong accusations, and walking away. Endings you've found are remembered on the title screen.
- **Save/Load:** an autosave (on area change and evidence pickup) plus 3 manual slots, stored in localStorage.
- **Procedural audio (Web Audio):** howling wind that's muffled indoors, crunching snow and hollow wooden footsteps, ice cracks, a distant church bell every few minutes, and sparse melancholic piano phrases separated by long silences.

---

## Project structure

```
frost-veil/
├─ run.bat / run.sh          one-click launchers
├─ index.html, vite.config.ts, tsconfig.json, package.json
├─ public/favicon.svg
├─ docs/ASSET_PLAN.md        pixel-art & audio production plan / swap guide
├─ docs/DESIGN.md            narrative, case solution, systems overview (SPOILERS)
└─ src/
   ├─ main.tsx, App.tsx      React root, global hotkeys, UI mode router
   ├─ assets/
   │  ├─ textures.ts         procedural pixel-art generator (every sprite)
   │  ├─ palettes.ts         character palettes
   │  └─ icons.ts            texture → base64 bridge for React (portraits, evidence)
   ├─ scenes/
   │  ├─ createGame.ts       Phaser config + React↔Phaser event wiring
   │  ├─ BootScene.ts        generates textures
   │  ├─ TitleScene.ts       animated title backdrop
   │  ├─ GameScene.ts        player, input, flashlight, interactions, areas
   │  └─ WorldBuilder.ts     builds town + interiors from data
   ├─ systems/
   │  ├─ store.ts            tiny external store (useSyncExternalStore) = single source of truth
   │  ├─ Lighting.ts         darkness RenderTexture, static lights, ray-cast flashlight
   │  ├─ Weather.ts          snow, fog, wind gusts
   │  ├─ audio.ts            procedural audio engine
   │  ├─ dialogue.ts         condition checks + effects
   │  ├─ investigation.ts    deductions, objectives, accusation → ending
   │  ├─ save.ts             save slots, endings persistence
   │  ├─ EventBus.ts, constants.ts
   ├─ data/                  ALL content: world layout, evidence, dialogue, deductions, endings, characters
   ├─ components/            React UI: HUD, DialogueBox, Notebook, Board, PauseMenu, TitleMenu, Intro, EndingScreen…
   └─ ui/styles.css          UI styling (frost vignette, film grain, paper notebook, cork board)
```

### Architecture in one paragraph
Phaser owns the world: rendering, physics, lighting and input for movement. React owns every menu and overlay. They share one tiny store (`systems/store.ts`). Phaser writes to it (prompt, battery, area, evidence) and reads `mode` to decide whether the player can act, and React renders from it and changes `mode`. Scene lifecycle requests (new game, load, quit) go through `EventBus`. All content lives in `src/data/`, so you can write a new case without touching engine code.

### Extending
- **New clue:** add to `data/evidence.ts`, place it in `CLUE_SPOTS` (`data/world.ts`), draw an icon in `genIcons` (`assets/textures.ts`).
- **New deduction:** add a pair to `data/deductions.ts`.
- **New dialogue branch:** add nodes/choices with `cond` gates in `data/dialogue.ts`.
- **Real art:** see `docs/ASSET_PLAN.md`. Load PNGs with the same texture keys in `BootScene` and skip the matching generator.

Troubleshooting: if port 5173 is busy, close the other dev server (the port is strict so Chrome always opens the right URL). If Chrome shows a blank page, check that hardware acceleration is on (WebGL). Phaser also falls back to Canvas automatically.
