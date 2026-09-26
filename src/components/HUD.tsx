import { useGame } from '../systems/store';
import { objective } from '../systems/investigation';
import { EVIDENCE_IDS } from '../data/evidence';

export function HUD() {
  const s = useGame();
  const segs = 10; const filled = Math.ceil((s.battery / 100) * segs);
  const low = s.battery < 20;
  return (
    <div className="hud">
      <div className="hud-tl">
        <div className="hud-loc">{s.areaName}</div>
        <div className="hud-obj"><span className="diamond">◆</span>{objective(s)}</div>
      </div>
      <div className="hud-tr">
        <div className={`battery ${low ? 'low' : ''} ${s.flashlightOn ? 'on' : ''}`}>
          <div className="battery-label"><kbd>F</kbd> FLASHLIGHT <b>{s.flashlightOn ? 'ON' : 'OFF'}</b></div>
          <div className="battery-cells">
            {Array.from({ length: segs }, (_, i) => <i key={i} className={i < filled ? 'full' : ''} />)}
            <span className="battery-nub" />
          </div>
          <div className="battery-pct">{Math.round(s.battery)}%</div>
        </div>
      </div>
      {s.prompt && s.mode === 'playing' && <div className="hud-prompt"><kbd>E</kbd>{s.prompt}</div>}
      <div className="hud-bl">
        <span>EVIDENCE {s.evidence.length}/{EVIDENCE_IDS.length}</span>
        <span>DEDUCTIONS {s.deductions.length}</span>
        {s.muted && <span>MUTED</span>}
      </div>
      <div className="hud-br">
        <kbd>WASD</kbd> move <kbd>SHIFT</kbd> run <kbd>MOUSE</kbd> aim <kbd>J</kbd> notebook <kbd>B</kbd> board <kbd>ESC</kbd> menu
      </div>
    </div>
  );
}
