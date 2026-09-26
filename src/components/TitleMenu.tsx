import { useState } from 'react';
import { useGame, resetState, setMode } from '../systems/store';
import { hasSave, loadGame, saveMeta, SLOTS, unlockedEndings, formatTime, Slot } from '../systems/save';
import { EventBus, EV } from '../systems/EventBus';
import { audio } from '../systems/audio';
import { ENDINGS, ENDING_IDS } from '../data/endings';

export function TitleMenu() {
  const s = useGame();
  const [panel, setPanel] = useState<'main' | 'load' | 'endings' | 'controls'>('main');
  const canContinue = hasSave('auto');
  const unlocked = unlockedEndings();

  const newGame = () => { audio.init(); audio.click(); resetState(); EventBus.emit(EV.START_GAME); setMode('intro'); };
  const load = (slot: Slot) => { audio.init(); if (loadGame(slot)) EventBus.emit(EV.START_GAME); };

  return (
    <div className="title-screen">
      <div className="title-logo">
        <h1 data-text="FROST VEIL">FROST VEIL</h1>
        <p className="title-sub">A Hollowpine Mystery</p>
      </div>
      {!s.booted ? <div className="title-loading">Painting the snow…</div> : (
        <div className="title-menu">
          {panel === 'main' && <>
            {canContinue && <button className="menu-btn primary" onClick={() => load('auto')}>Continue</button>}
            <button className={`menu-btn ${canContinue ? '' : 'primary'}`} onClick={newGame}>New Investigation</button>
            <button className="menu-btn" onClick={() => { audio.init(); setPanel('load'); }}>Load Case File</button>
            <button className="menu-btn" onClick={() => setPanel('endings')}>Endings <small>{unlocked.length}/{ENDING_IDS.length}</small></button>
            <button className="menu-btn" onClick={() => setPanel('controls')}>Controls</button>
          </>}
          {panel === 'load' && <>
            {SLOTS.map((slot) => { const m = saveMeta(slot); return (
              <button key={slot} className="menu-btn slot" disabled={!m} onClick={() => load(slot)}>
                <span>{slot === 'auto' ? 'Autosave' : `Slot ${slot}`}</span>
                <small>{m ? `${m.areaName} · ${m.evidence} evidence · ${formatTime(m.playTime)}` : 'Empty'}</small>
              </button>); })}
            <button className="menu-btn ghost" onClick={() => setPanel('main')}>Back</button>
          </>}
          {panel === 'endings' && <>
            <div className="endings-list">
              {ENDING_IDS.map((id) => <div key={id} className={`ending-chip ${unlocked.includes(id) ? 'got' : ''}`}>
                {unlocked.includes(id) ? <><b>{ENDINGS[id].title}</b><small>{ENDINGS[id].subtitle}</small></> : <><b>? ? ?</b><small>Undiscovered</small></>}
              </div>)}
            </div>
            <button className="menu-btn ghost" onClick={() => setPanel('main')}>Back</button>
          </>}
          {panel === 'controls' && <>
            <ControlsList />
            <button className="menu-btn ghost" onClick={() => setPanel('main')}>Back</button>
          </>}
        </div>
      )}
      <div className="title-foot">Headphones recommended · Best in Google Chrome</div>
    </div>
  );
}

export function ControlsList() {
  const rows: [string, string][] = [
    ['WASD / Arrows', 'Walk'], ['Shift', 'Run'], ['Mouse', 'Aim flashlight'], ['F / Right-click', 'Flashlight on/off'],
    ['E', 'Examine / Talk / Enter'], ['J / Tab', 'Detective notebook'], ['B', 'Investigation board'], ['Esc / P', 'Pause menu'], ['M', 'Mute'],
  ];
  return <div className="controls-list">{rows.map(([k, v]) => <div key={k}><kbd>{k}</kbd><span>{v}</span></div>)}</div>;
}
