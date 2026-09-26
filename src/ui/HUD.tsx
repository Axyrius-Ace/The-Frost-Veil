import { useGame } from './useGame';
import { EVIDENCE_ORDER, DEDUCTIONS } from '../data/story';

const TOUCH = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

export function HUD() {
  const s = useGame();
  const filled = Math.ceil(s.battery / 10);
  const low = s.battery < 15;
  return (
    <div className="hud">
      <div className={`hud-battery ${low ? 'low' : ''} ${s.flashlightOn ? 'on' : 'off'}`}>
        <div className="hud-label"><span className="key">F</span> Flashlight {s.flashlightOn ? 'ON' : 'OFF'}</div>
        <div className="cells">
          {Array.from({ length: 10 }, (_, i) => <i key={i} className={i < filled ? 'full' : ''} />)}
          <b className="nub" />
        </div>
        <div className="hud-pct">{Math.ceil(s.battery)}%</div>
      </div>
      <div className="hud-case">
        <div>Evidence <b>{s.evidence.length}</b>/{EVIDENCE_ORDER.length}</div>
        <div>Deductions <b>{s.deductions.length}</b>/{DEDUCTIONS.length}</div>
      </div>
      {s.banner && <div key={s.banner.id} className="area-banner">{s.banner.text}</div>}
      {s.prompt && s.ui === null && <div className="prompt">{TOUCH ? <><b>E</b> · tap to </> : <span className="key">E</span>} {s.prompt}</div>}
      <div className="hud-keys">
        <span><span className="key">N</span> Notebook</span>
        <span><span className="key">B</span> Board</span>
        <span><span className="key">Esc</span> Menu</span>
      </div>
    </div>
  );
}
