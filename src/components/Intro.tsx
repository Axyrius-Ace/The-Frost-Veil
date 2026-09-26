import { useEffect, useState } from 'react';
import { setMode } from '../systems/store';

const LINES = [
  'December 21st. The last bus up the mountain.',
  'Hollowpine. Population 212. Cut off by the storm for eleven days.',
  'The sheriff wired the valley for help. You were the only one who came.',
  'You stepped off the bus into a blizzard, and into a murder.',
  'The snow has not stopped. It isn\'t going to.',
];

export function Intro() {
  const [i, setI] = useState(0);
  const done = i >= LINES.length;
  useEffect(() => {
    if (done) return;
    const t = window.setTimeout(() => setI((v) => v + 1), 2600);
    return () => window.clearTimeout(t);
  }, [i, done]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ([' ', 'enter', 'e', 'escape'].includes(e.key.toLowerCase())) { if (done || e.key === 'Escape') setMode('playing'); else setI(LINES.length); } };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [done]);
  return (
    <div className="intro" onClick={() => (done ? setMode('playing') : setI(LINES.length))}>
      <div className="intro-lines">
        {LINES.slice(0, Math.max(1, i + (done ? 0 : 1))).map((l, n) => <p key={n} style={{ animationDelay: `${n === i ? 0 : 0}s` }}>{l}</p>)}
      </div>
      <div className={`intro-continue ${done ? 'show' : ''}`}>Press SPACE to begin</div>
      <div className="intro-skip">SPACE skip · ESC begin</div>
    </div>
  );
}
