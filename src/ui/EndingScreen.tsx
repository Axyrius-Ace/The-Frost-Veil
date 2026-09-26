import { useGame } from './useGame';
import { store } from '../systems/GameStore';
import { ENDINGS, EVIDENCE_ORDER, DEDUCTIONS } from '../data/story';
import { showTitle } from '../systems/PhaserGame';
import { loadGame } from './TitleScreen';
import { readMeta } from '../systems/SaveSystem';

export function EndingScreen() {
  const s = useGame();
  const e = ENDINGS[s.endingId ?? ''] ?? ENDINGS.white_silence;
  const mins = Math.floor(s.playTime / 60);
  return (
    <div className={`ending tone-${e.tone}`}>
      <div className="ending-inner">
        <div className="ending-sub">{e.subtitle}</div>
        <h1>{e.title}</h1>
        {e.text.map((t, i) => <p key={i} style={{ animationDelay: `${1.2 + i * 2.2}s` }}>{t}</p>)}
        <div className="ending-stats" style={{ animationDelay: `${1.6 + e.text.length * 2.2}s` }}>
          <span>Evidence {s.evidence.length}/{EVIDENCE_ORDER.length}</span>
          <span>Deductions {s.deductions.length}/{DEDUCTIONS.length}</span>
          <span>Wrong threads {s.wrongLinks}</span>
          <span>{mins} min in the snow</span>
        </div>
        <div className="row" style={{ animationDelay: `${2 + e.text.length * 2.2}s` }}>
          {readMeta('auto') && <button className="btn" onClick={() => loadGame('auto')}>Return to the case</button>}
          <button className="btn ghost" onClick={() => { store.toTitle(); showTitle(); }}>Title screen</button>
        </div>
      </div>
    </div>
  );
}
