import { useEffect, useState } from 'react';
import { useGame, setMode } from '../systems/store';
import { ENDINGS, ENDING_IDS } from '../data/endings';
import { EVIDENCE_IDS } from '../data/evidence';
import { unlockedEndings, formatTime, deleteSave } from '../systems/save';
import { EventBus, EV } from '../systems/EventBus';

export function EndingScreen() {
  const s = useGame();
  const e = s.ending ? ENDINGS[s.ending] : null;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!e || shown >= e.paragraphs.length) return;
    const t = window.setTimeout(() => setShown((v) => v + 1), shown === 0 ? 1600 : 3200);
    return () => window.clearTimeout(t);
  }, [shown, e]);
  if (!e) return null;
  const done = shown >= e.paragraphs.length;
  const back = () => { deleteSave('auto'); EventBus.emit(EV.TO_TITLE); setMode('title'); };
  return (
    <div className={`ending tone-${e.tone}`} onClick={() => !done && setShown(e.paragraphs.length)}>
      <div className="ending-inner">
        <div className="ending-sub">{e.subtitle}</div>
        <h1>{e.title}</h1>
        {e.paragraphs.slice(0, shown).map((p, i) => <p key={i}>{p}</p>)}
        {done && <div className="ending-stats">
          <span>Evidence {s.evidence.length}/{EVIDENCE_IDS.length}</span>
          <span>Deductions {s.deductions.length}</span>
          <span>Time {formatTime(s.playTime)}</span>
          <span>Endings {unlockedEndings().length}/{ENDING_IDS.length}</span>
        </div>}
        {done && <button className="menu-btn primary" onClick={back}>Return to Title</button>}
      </div>
    </div>
  );
}
