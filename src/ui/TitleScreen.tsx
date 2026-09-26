import { useState } from 'react';
import { store } from '../systems/GameStore';
import { audio } from '../systems/AudioSystem';
import { startWorld } from '../systems/PhaserGame';
import { readMeta } from '../systems/SaveSystem';
import { CASE_TITLE, INTRO_TEXT } from '../data/story';
import { SaveSlots } from '../components/SaveSlots';

function begin(fn: () => void) {
  audio.init(store.get().settings);
  audio.start();
  audio.click();
  fn();
}

export function startNewGame() {
  begin(() => {
    store.newGame();
    startWorld();
    store.set({ ui: 'inspect', inspect: { title: 'Case File No. 117', tag: CASE_TITLE, text: INTRO_TEXT } });
  });
}

export function loadGame(slot: string) {
  begin(() => { if (store.load(slot)) startWorld(); });
}

export function TitleScreen() {
  const [view, setView] = useState<'main' | 'load' | 'credits'>('main');
  const hasAuto = !!readMeta('auto');
  return (
    <div className="title-screen">
      <div className="title-block">
        <h1 className="logo"><span>FROST</span><span>VEIL</span></h1>
        <p className="tagline">Hollowmere. The snow keeps its secrets.</p>
      </div>
      {view === 'main' && (
        <nav className="title-menu">
          {hasAuto && <button className="btn primary" onClick={() => loadGame('auto')}>Continue</button>}
          <button className={`btn ${hasAuto ? '' : 'primary'}`} onClick={startNewGame}>New Investigation</button>
          <button className="btn" onClick={() => { audio.init(store.get().settings); audio.click(); setView('load'); }}>Load Case</button>
          <button className="btn ghost" onClick={() => setView('credits')}>Credits</button>
        </nav>
      )}
      {view === 'load' && (
        <div className="panel small">
          <h3>Load Case</h3>
          <SaveSlots mode="load" includeAuto onPick={loadGame} />
          <button className="btn ghost" onClick={() => setView('main')}>Back</button>
        </div>
      )}
      {view === 'credits' && (
        <div className="panel small credits">
          <h3>FROST VEIL</h3>
          <p>Direction, story, pixel art, code and sound design generated for this build.</p>
          <p>Every sprite and every sound is procedural: no asset files, just canvas and Web Audio.</p>
          <p>Built with Phaser 3, React, TypeScript and Vite.</p>
          <button className="btn ghost" onClick={() => setView('main')}>Back</button>
        </div>
      )}
      <p className="title-hint">WASD move · Shift run · Mouse aim · F flashlight · E interact · N notebook · B board · Esc menu</p>
      <p className="title-hint small">Best with headphones.</p>
    </div>
  );
}
