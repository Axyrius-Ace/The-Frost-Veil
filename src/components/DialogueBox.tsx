import { useEffect, useMemo, useState } from 'react';
import { useGame, setState, setMode, setFlag, getState } from '../systems/store';
import { DIALOGUES, Choice } from '../data/dialogue';
import { CHARACTERS } from '../data/characters';
import { check, applyEffects } from '../systems/dialogue';
import { audio } from '../systems/audio';
import { Portrait } from './common';

export function DialogueBox() {
  const s = useGame();
  const dlg = s.dialogue;
  const tree = dlg ? DIALOGUES[dlg.npc] : null;
  const node = tree && dlg ? tree.nodes[dlg.node] : null;
  const [shown, setShown] = useState(0);
  const text = node?.text ?? '';
  const typing = shown < text.length;

  const choices = useMemo(() => (node?.choices ?? []).filter((c) => check(c.cond)), [node, s.evidence, s.flags, s.deductions]);

  useEffect(() => { if (node) applyEffects(node.effects); setShown(0); }, [dlg?.npc, dlg?.node]);
  useEffect(() => {
    if (!typing) return;
    const t = window.setInterval(() => setShown((v) => Math.min(text.length, v + 2)), 22);
    return () => window.clearInterval(t);
  }, [typing, text]);

  const close = () => { setState({ dialogue: null }); setMode('playing'); };
  const go = (next?: string) => {
    audio.click();
    if (!dlg || !next || next === 'END') return close();
    setState({ dialogue: { npc: dlg.npc, node: next } });
  };
  const pick = (c: Choice) => {
    if (!dlg) return;
    setFlag(`seen:${dlg.npc}:${c.next}`);
    applyEffects(c.effects);
    go(c.next);
  };

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'escape') { close(); return; }
      if (typing && [' ', 'enter', 'e'].includes(key)) { setShown(text.length); return; }
      if (!typing && !node?.choices && [' ', 'enter', 'e'].includes(key)) { go(node?.next); return; }
      const n = parseInt(e.key, 10);
      if (!typing && n >= 1 && n <= choices.length) pick(choices[n - 1]);
    };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  });

  if (!dlg || !node) return null;
  const ch = CHARACTERS[dlg.npc];
  const narrator = node.speaker === 'narrator';
  const flags = getState().flags;

  return (
    <div className="dialogue-wrap">
      <div className="dialogue">
        <div className="dialogue-portrait"><Portrait id={dlg.npc} size={144} /><div className="dialogue-name">{ch.name}<small>{ch.role}</small></div></div>
        <div className="dialogue-body">
          <p className={`dialogue-text ${narrator ? 'narrator' : ''}`} onClick={() => typing && setShown(text.length)}>
            {narrator ? '' : '“'}{text.slice(0, shown)}{!typing && !narrator ? '”' : ''}{typing && <span className="caret">▌</span>}
          </p>
          {!typing && (node.choices ? (
            <ol className="dialogue-choices">
              {choices.map((c, i) => {
                const seen = flags[`seen:${dlg.npc}:${c.next}`];
                const isNew = !!c.cond && !seen;
                return <li key={c.text} className={`${seen ? 'seen' : ''} ${isNew ? 'new' : ''} ${c.next === 'END' ? 'leave' : ''}`} onClick={() => pick(c)}>
                  <span className="num">{i + 1}</span>{c.text}{isNew && <span className="tag">NEW</span>}
                </li>;
              })}
            </ol>
          ) : <button className="dialogue-next" onClick={() => go(node.next)}>Continue ▸</button>)}
        </div>
      </div>
    </div>
  );
}
