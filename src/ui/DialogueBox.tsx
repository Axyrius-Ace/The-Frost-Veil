import { useEffect } from 'react';
import { useGame } from './useGame';
import { DIALOGUES } from '../data/dialogues';
import { choose, gotoNode, isSeen, visibleChoices } from '../systems/DialogueSystem';
import { useTypewriter } from '../components/Typewriter';
import { Portrait } from '../components/Portrait';
import { audio } from '../systems/AudioSystem';

export function DialogueBox() {
  const s = useGame();
  const d = s.dialogue;
  const node = d ? DIALOGUES[d.npc]?.nodes[d.node] : undefined;
  const { shown, done, skip } = useTypewriter(node?.text ?? '');
  const choices = d && node ? visibleChoices(d.npc, d.node) : [];

  const advance = () => {
    if (!d || !node) return;
    if (!done) { skip(); return; }
    if (!node.choices) { audio.click(); gotoNode(d.npc, node.next ?? null); }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!d || !node) return;
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'e' || e.key === 'E') { e.preventDefault(); advance(); return; }
      const n = parseInt(e.key, 10);
      if (done && node.choices && n >= 1 && n <= choices.length) choose(d.npc, choices[n - 1]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!d || !node) return null;
  const narration = node.speaker === 'Narration';
  return (
    <div className="dialogue" onClick={() => { if (!done) skip(); }}>
      {!narration && <div className="dialogue-portrait"><Portrait who={d.npc} size={132} /></div>}
      <div className="dialogue-body">
        {!narration && <div className="speaker">{node.speaker}</div>}
        <p className={`line ${narration ? 'narration' : ''}`}>{shown}<span className={`caret ${done ? 'hide' : ''}`}>▌</span></p>
        {done && node.choices && (
          <ol className="choices">
            {choices.map((c, i) => {
              const evidenceBacked = !!c.requires?.length;
              return (
                <li key={c.text}>
                  <button className={`choice ${isSeen(d.npc, c.next) ? 'seen' : ''} ${evidenceBacked ? 'press' : ''}`} onClick={() => choose(d.npc, c)}>
                    <span className="num">{i + 1}</span>{evidenceBacked && <span className="press-tag">PRESS</span>}{c.text}
                  </button>
                </li>
              );
            })}
          </ol>
        )}
        {done && !node.choices && <button className="continue" onClick={advance}>Continue ▸</button>}
      </div>
    </div>
  );
}
