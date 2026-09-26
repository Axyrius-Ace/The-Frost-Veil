import { useState } from 'react';
import { setMode, useGame } from '../systems/store';
import { saveGame, loadGame, saveMeta, formatTime, Slot } from '../systems/save';
import { EventBus, EV } from '../systems/EventBus';
import { audio } from '../systems/audio';
import { ControlsList } from './TitleMenu';

export function PauseMenu() {
  useGame();
  const [panel, setPanel] = useState<'main' | 'save' | 'load' | 'settings'>('main');
  const [vol, setVol] = useState(audio.getVolume());
  const [, force] = useState(0);
  const slots: Slot[] = ['1', '2', '3'];

  const quit = () => { saveGame('auto', true); EventBus.emit(EV.TO_TITLE); setMode('title'); };

  return (
    <div className="modal-back">
      <div className="pause">
        <h2>Paused</h2>
        {panel === 'main' && <>
          <button className="menu-btn primary" onClick={() => setMode('playing')}>Resume</button>
          <button className="menu-btn" onClick={() => setPanel('save')}>Save Case File</button>
          <button className="menu-btn" onClick={() => setPanel('load')}>Load Case File</button>
          <button className="menu-btn" onClick={() => setPanel('settings')}>Settings &amp; Controls</button>
          <button className="menu-btn ghost" onClick={quit}>Save &amp; Quit to Title</button>
        </>}
        {(panel === 'save' || panel === 'load') && <>
          {(panel === 'load' ? (['auto', ...slots] as Slot[]) : slots).map((slot) => {
            const m = saveMeta(slot);
            return <button key={slot} className="menu-btn slot" disabled={panel === 'load' && !m}
              onClick={() => { if (panel === 'save') { saveGame(slot); force((v) => v + 1); } else if (loadGame(slot)) { EventBus.emit(EV.START_GAME); } }}>
              <span>{slot === 'auto' ? 'Autosave' : `Slot ${slot}`}</span>
              <small>{m ? `${m.areaName} · ${m.evidence} evidence · ${formatTime(m.playTime)} · ${new Date(m.savedAt).toLocaleString()}` : 'Empty'}</small>
            </button>;
          })}
          <button className="menu-btn ghost" onClick={() => setPanel('main')}>Back</button>
        </>}
        {panel === 'settings' && <>
          <label className="slider">Master volume
            <input type="range" min={0} max={1} step={0.05} value={vol} onChange={(e) => { const v = +e.target.value; setVol(v); audio.setVolume(v); }} />
          </label>
          <ControlsList />
          <button className="menu-btn ghost" onClick={() => setPanel('main')}>Back</button>
        </>}
      </div>
    </div>
  );
}
