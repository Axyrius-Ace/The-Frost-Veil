import { useState } from 'react';
import { useGame } from './useGame';
import { store } from '../systems/GameStore';
import { audio } from '../systems/AudioSystem';
import { SUSPECTS, ENDINGS } from '../data/story';
import { resolveEnding, suspectStatus } from '../systems/Deduction';
import { Portrait } from '../components/Portrait';

export function AccuseModal() {
  const s = useGame();
  const [pick, setPick] = useState<string | null>(null);
  const options = SUSPECTS.filter(p => !p.witness);
  const confirm = () => {
    if (!pick) return;
    const id = resolveEnding(pick, s.deductions);
    audio.ending(ENDINGS[id]?.tone === 'true');
    store.set({ screen: 'ending', ui: null, endingId: id, accused: pick, prompt: null });
  };
  return (
    <div className="modal-backdrop">
      <div className="accuse">
        <h2>Who killed Marta Kell?</h2>
        <p className="sub">There is no taking this back. The pass opens in three days, and you will carry one name down the mountain.</p>
        <div className="accuse-grid">
          {options.map(p => {
            const st = suspectStatus(p.id, s.deductions);
            return (
              <button key={p.id} className={`accuse-card ${pick === p.id ? 'picked' : ''}`} onClick={() => { audio.click(); setPick(p.id); }}>
                <Portrait who={p.id} size={90} />
                <b>{p.name}</b><small>{p.role}</small>
                <span className="mini">{st.cleared ? 'Alibi holds' : st.implicated ? `${st.implicated} deduction(s) against` : 'No deductions'}</span>
              </button>
            );
          })}
          <button className={`accuse-card accident ${pick === 'accident' ? 'picked' : ''}`} onClick={() => { audio.click(); setPick('accident'); }}>
            <div className="snowglyph">❄</div><b>No one</b><small>Rule it an accident</small>
          </button>
        </div>
        <div className="row">
          <button className="btn ghost" onClick={() => store.set({ ui: 'board' })}>Not yet</button>
          <button className="btn danger" disabled={!pick} onClick={confirm}>Make the accusation</button>
        </div>
      </div>
    </div>
  );
}
