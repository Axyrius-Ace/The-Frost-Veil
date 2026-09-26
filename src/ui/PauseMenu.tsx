import { useState } from 'react';
import { useGame } from './useGame';
import { store } from '../systems/GameStore';
import { audio } from '../systems/AudioSystem';
import { showTitle } from '../systems/PhaserGame';
import { SaveSlots } from '../components/SaveSlots';
import { loadGame } from './TitleScreen';

type View = 'main' | 'save' | 'load' | 'settings' | 'controls';

export function PauseMenu() {
  const s = useGame();
  const [view, setView] = useState<View>('main');
  const [msg, setMsg] = useState<string | null>(null);
  const go = (v: View) => { audio.click(); setMsg(null); setView(v); };
  const setVol = (k: 'master' | 'music', v: number) => { store.setSettings({ [k]: v }); audio.applySettings({ ...store.get().settings, [k]: v }); };
  return (
    <div className="modal-backdrop">
      <div className="panel pause">
        <h2>Paused</h2>
        {view === 'main' && (
          <div className="menu-col">
            <button className="btn primary" onClick={() => store.closeUI()}>Resume</button>
            <button className="btn" onClick={() => go('save')}>Save Game</button>
            <button className="btn" onClick={() => go('load')}>Load Game</button>
            <button className="btn" onClick={() => go('settings')}>Audio</button>
            <button className="btn" onClick={() => go('controls')}>Controls</button>
            <button className="btn ghost" onClick={() => { store.autosave(); store.toTitle(); showTitle(); }}>Quit to Title</button>
          </div>
        )}
        {view === 'save' && (
          <>
            <SaveSlots mode="save" onPick={slot => { setMsg(store.save(slot) ? `Saved to slot ${slot}.` : 'Could not save (storage full or blocked).'); audio.pickup(); }} />
            {msg && <p className="hint">{msg}</p>}
            <button className="btn ghost" onClick={() => go('main')}>Back</button>
          </>
        )}
        {view === 'load' && (
          <>
            <SaveSlots mode="load" includeAuto onPick={slot => loadGame(slot)} />
            <button className="btn ghost" onClick={() => go('main')}>Back</button>
          </>
        )}
        {view === 'settings' && (
          <div className="settings">
            <label>Master volume<input type="range" min={0} max={1} step={0.05} value={s.settings.master} onChange={e => setVol('master', +e.target.value)} /></label>
            <label>Music &amp; bells<input type="range" min={0} max={1} step={0.05} value={s.settings.music} onChange={e => setVol('music', +e.target.value)} /></label>
            <button className="btn ghost" onClick={() => go('main')}>Back</button>
          </div>
        )}
        {view === 'controls' && (
          <div className="controls">
            <table><tbody>
              <tr><td>WASD / Arrows</td><td>Walk</td></tr>
              <tr><td>Shift</td><td>Run</td></tr>
              <tr><td>Mouse</td><td>Aim flashlight</td></tr>
              <tr><td>F / Right click</td><td>Flashlight on / off</td></tr>
              <tr><td>E / Space</td><td>Interact, talk, advance dialogue</td></tr>
              <tr><td>1 - 9</td><td>Pick dialogue choice</td></tr>
              <tr><td>N / Tab</td><td>Detective's notebook</td></tr>
              <tr><td>B</td><td>Investigation board</td></tr>
              <tr><td>Esc</td><td>Close panel / pause</td></tr>
            </tbody></table>
            <button className="btn ghost" onClick={() => go('main')}>Back</button>
          </div>
        )}
      </div>
    </div>
  );
}
