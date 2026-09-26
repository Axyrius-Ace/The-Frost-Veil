import { useState } from 'react';
import { useGame } from './useGame';
import { store } from '../systems/GameStore';
import { audio } from '../systems/AudioSystem';
import { EVIDENCE, EVIDENCE_ORDER, SUSPECTS, DEDUCTIONS } from '../data/story';
import { suspectStatus } from '../systems/Deduction';
import { Portrait } from '../components/Portrait';
import type { EvidenceKind } from '../systems/types';

type Tab = 'evidence' | 'suspects' | 'journal' | 'notes';
const KIND_LABEL: Record<EvidenceKind, string> = { physical: 'Physical', document: 'Documents', testimony: 'Testimony' };
const clock = (t: number) => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;

export function Notebook() {
  const s = useGame();
  const [tab, setTab] = useState<Tab>('evidence');
  const [sel, setSel] = useState<string | null>(s.evidence[s.evidence.length - 1] ?? null);
  const selected = sel ? EVIDENCE[sel] : null;
  const tabBtn = (t: Tab, label: string) => (
    <button className={`tab ${tab === t ? 'active' : ''}`} onClick={() => { audio.click(); setTab(t); }}>{label}</button>
  );
  return (
    <div className="modal-backdrop">
      <div className="notebook">
        <header className="nb-head">
          <h2>Detective's Notebook</h2>
          <nav>{tabBtn('evidence', 'Evidence')}{tabBtn('suspects', 'People')}{tabBtn('journal', 'Journal')}{tabBtn('notes', 'Notes')}</nav>
          <button className="x" onClick={() => store.closeUI()}>✕</button>
        </header>

        {tab === 'evidence' && (
          <div className="nb-evidence">
            <div className="nb-list">
              {(['physical', 'document', 'testimony'] as EvidenceKind[]).map(kind => {
                const items = EVIDENCE_ORDER.filter(id => EVIDENCE[id].kind === kind);
                return (
                  <section key={kind}>
                    <h4>{KIND_LABEL[kind]} <small>{items.filter(i => s.evidence.includes(i)).length}/{items.length}</small></h4>
                    {items.map(id => s.evidence.includes(id)
                      ? <button key={id} className={`nb-item ${sel === id ? 'active' : ''}`} onClick={() => setSel(id)}><span className="ico">{EVIDENCE[id].icon}</span>{EVIDENCE[id].name}</button>
                      : <div key={id} className="nb-item unknown">? ? ?</div>)}
                  </section>
                );
              })}
            </div>
            <div className="nb-detail">
              {selected ? (
                <>
                  <div className="nb-kind">{KIND_LABEL[selected.kind]}</div>
                  <h3><span className="ico big">{selected.icon}</span>{selected.name}</h3>
                  <p>{selected.description}</p>
                  <p className="hint">Connect clues on the Investigation Board <span className="key">B</span> to form deductions.</p>
                </>
              ) : <p className="empty">Nothing yet. Search the town. Some things only show in the flashlight's beam.</p>}
            </div>
          </div>
        )}

        {tab === 'suspects' && (
          <div className="nb-suspects">
            {SUSPECTS.map(p => {
              const st = suspectStatus(p.id, s.deductions);
              const met = s.flags.includes(`met_${p.id}`);
              return (
                <div key={p.id} className={`suspect ${met ? '' : 'unmet'}`}>
                  <Portrait who={p.id} size={96} />
                  <div>
                    <h3>{p.name}</h3>
                    <div className="role">{p.role}</div>
                    <p>{met ? p.bio : 'Not yet interviewed.'}</p>
                    <div className="status">
                      {p.witness ? <span className="tag neutral">Witness</span>
                        : st.cleared ? <span className="tag clear">Alibi holds</span>
                        : st.implicated > 0 ? <span className="tag guilty">Suspicion {'●'.repeat(st.implicated)}{'○'.repeat(Math.max(0, 4 - st.implicated))}</span>
                        : <span className="tag neutral">Undetermined</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="deduction-list">
              <h4>Deductions</h4>
              {s.deductions.length === 0 && <p className="empty">None yet.</p>}
              {DEDUCTIONS.filter(d => s.deductions.includes(d.id)).map(d => <div key={d.id} className="ded"><b>{d.title}.</b> {d.text}</div>)}
            </div>
          </div>
        )}

        {tab === 'journal' && (
          <div className="nb-journal">
            {s.journal.length === 0 && <p className="empty">Your journal is empty.</p>}
            {[...s.journal].reverse().map((j, i) => <div key={i} className="jl"><span className="t">{clock(j.t)}</span>{j.text}</div>)}
          </div>
        )}

        {tab === 'notes' && (
          <div className="nb-notes">
            <textarea value={s.notes} placeholder="Your own theories. Saved with the game." onChange={e => store.set({ notes: e.target.value })} />
          </div>
        )}
        <footer className="nb-foot"><span><span className="key">N</span> close</span><span><span className="key">B</span> open Investigation Board</span></footer>
      </div>
    </div>
  );
}
