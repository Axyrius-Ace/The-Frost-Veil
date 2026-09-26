import { useState } from 'react';
import { useGame, setMode, GameState } from '../systems/store';
import { EVIDENCE, EVIDENCE_IDS } from '../data/evidence';
import { DEDUCTIONS } from '../data/deductions';
import { CHARACTERS, CharacterNote } from '../data/characters';
import { isContradicted } from '../systems/investigation';
import { formatTime } from '../systems/save';
import { audio } from '../systems/audio';
import { Icon, Portrait } from './common';

type Tab = 'evidence' | 'people' | 'journal' | 'deductions';

const noteVisible = (n: CharacterNote, s: GameState) =>
  (!n.flag || s.flags[n.flag]) && (!n.evidence || s.evidence.includes(n.evidence)) && (!n.deduction || s.deductions.includes(n.deduction));

export function Notebook() {
  const s = useGame();
  const [tab, setTab] = useState<Tab>('evidence');
  const [sel, setSel] = useState<string | null>(s.evidence[s.evidence.length - 1] ?? null);
  const [person, setPerson] = useState('halvorsen');
  const people = Object.values(CHARACTERS).filter((c) => c.id === 'halvorsen' || s.talkedTo.includes(c.id) || s.flags.suspects_known);
  const ev = sel ? EVIDENCE[sel] : null;
  const pc = CHARACTERS[person];

  const switchTab = (t: Tab) => { setTab(t); audio.page(); };

  return (
    <div className="modal-back">
      <div className="notebook">
        <div className="nb-tabs">
          {(['evidence', 'people', 'journal', 'deductions'] as Tab[]).map((t) => (
            <button key={t} className={tab === t ? 'active' : ''} onClick={() => switchTab(t)}>{t}</button>
          ))}
          <button className="nb-close" onClick={() => setMode('playing')}>✕</button>
        </div>
        <div className="nb-page">
          {tab === 'evidence' && (
            <div className="nb-split">
              <div className="nb-grid">
                {EVIDENCE_IDS.map((id) => {
                  const got = s.evidence.includes(id);
                  return <button key={id} className={`nb-slot ${got ? '' : 'empty'} ${sel === id ? 'sel' : ''}`} disabled={!got} onClick={() => setSel(id)} title={got ? EVIDENCE[id].name : 'Undiscovered'}>
                    {got ? <Icon id={id} size={48} /> : <span>?</span>}
                  </button>;
                })}
              </div>
              <div className="nb-detail">
                {ev ? <>
                  <Icon id={ev.id} size={96} />
                  <h3>{ev.name}</h3>
                  <p>{ev.description}</p>
                  <div className="nb-meta">Found: {ev.location}</div>
                </> : <p className="nb-empty">No evidence yet. Search the town, and remember: some things only show up in the beam of your flashlight.</p>}
              </div>
            </div>
          )}
          {tab === 'people' && (
            <div className="nb-split">
              <div className="nb-people">
                {people.map((c) => <button key={c.id} className={person === c.id ? 'sel' : ''} onClick={() => setPerson(c.id)}>
                  <Portrait id={c.id} size={48} /><span>{c.name}<small>{c.suspect ? 'Suspect' : 'Ally'}{s.talkedTo.includes(c.id) ? '' : ' · not yet questioned'}</small></span>
                </button>)}
              </div>
              <div className="nb-detail">
                <Portrait id={pc.id} size={112} />
                <h3>{pc.name}</h3>
                <div className="nb-meta">{pc.role}</div>
                <p>{pc.bio}</p>
                <ul className="nb-notes">
                  {pc.notes.filter((n) => noteVisible(n, s)).map((n) => <li key={n.text}>{n.text}</li>)}
                  {pc.notes.filter((n) => noteVisible(n, s)).length === 0 && <li className="nb-empty">Nothing noted yet.</li>}
                </ul>
              </div>
            </div>
          )}
          {tab === 'journal' && (
            <div className="nb-journal">
              {s.journal.length === 0 && <p className="nb-empty">The first page is blank. It won't stay that way.</p>}
              {[...s.journal].reverse().map((j, i) => <div key={i} className="nb-entry"><time>{formatTime(j.time)}</time><p>{j.text}</p></div>)}
            </div>
          )}
          {tab === 'deductions' && (
            <div className="nb-journal">
              {s.deductions.length === 0 && <p className="nb-empty">No deductions yet. Connect related evidence on the Investigation Board (B).</p>}
              {DEDUCTIONS.filter((d) => s.deductions.includes(d.id)).map((d) => (
                <div key={d.id} className={`nb-ded cat-${d.category} ${isContradicted(d, s) ? 'contra' : ''}`}>
                  <div className="nb-ded-cat">{d.category}{isContradicted(d, s) && ' · CONTRADICTED'}</div>
                  <h4>{d.title}</h4><p>{d.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="nb-foot">Time on case {formatTime(s.playTime)} · <kbd>J</kbd> close</div>
      </div>
    </div>
  );
}
