import { useEffect, useRef, useState } from 'react';
import { useGame, setMode, setState, getState, toast } from '../systems/store';
import { EVIDENCE } from '../data/evidence';
import { DEDUCTIONS } from '../data/deductions';
import { CHARACTERS, SUSPECT_IDS } from '../data/characters';
import { tryConnect, isContradicted, resolveAccusation, triggerEnding } from '../systems/investigation';
import { audio } from '../systems/audio';
import { Icon, Portrait } from './common';

const CARD_W = 150, CARD_H = 96;
function defaultPos(i: number) { return { x: 24 + (i % 4) * 176 + (i % 2) * 8, y: 24 + Math.floor(i / 4) * 128 + ((i * 37) % 13) }; }

export function Board() {
  const s = useGame();
  const [first, setFirst] = useState<string | null>(null);
  const [shake, setShake] = useState<string | null>(null);
  const [accuse, setAccuse] = useState(false);
  const [target, setTarget] = useState<string | null>(null);
  const drag = useRef<{ id: string; dx: number; dy: number; moved: boolean; sx: number; sy: number } | null>(null);
  const area = useRef<HTMLDivElement>(null);

  const pos = (id: string) => s.boardPos[id] ?? defaultPos(s.evidence.indexOf(id));

  useEffect(() => {
    if (!accuse) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setAccuse(false); setTarget(null); } };
    window.addEventListener('keydown', k, true); return () => window.removeEventListener('keydown', k, true);
  }, [accuse]);

  const click = (id: string) => {
    if (!first) { setFirst(id); audio.click(); return; }
    if (first === id) { setFirst(null); return; }
    const d = tryConnect(first, id);
    if (!d) {
      audio.fail(); setShake(id); window.setTimeout(() => setShake(null), 400);
      const already = DEDUCTIONS.find((x) => (x.a === first && x.b === id) || (x.a === id && x.b === first));
      toast(already ? 'Already connected.' : "These don't connect. Not yet, anyway.", 'warn');
    }
    setFirst(null);
  };

  const onDown = (e: React.PointerEvent, id: string) => {
    const p = pos(id);
    drag.current = { id, dx: e.clientX - p.x, dy: e.clientY - p.y, moved: false, sx: e.clientX, sy: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current; if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 5) return;
    d.moved = true;
    const r = area.current?.getBoundingClientRect();
    const x = Math.max(0, Math.min((r?.width ?? 900) - CARD_W, e.clientX - d.dx));
    const y = Math.max(0, Math.min((r?.height ?? 560) - CARD_H, e.clientY - d.dy));
    setState({ boardPos: { ...getState().boardPos, [d.id]: { x, y } } });
  };
  const onUp = () => { const d = drag.current; drag.current = null; if (d && !d.moved) click(d.id); };

  const links = DEDUCTIONS.filter((d) => s.deductions.includes(d.id));
  const canAccuse = s.deductions.length >= 2;

  return (
    <div className="modal-back">
      <div className="board">
        <div className="board-head">
          <h2>Investigation Board</h2>
          <p>Click one card, then another, to tie them together with string. Drag cards to rearrange.</p>
          <button className="nb-close" onClick={() => setMode('playing')}>✕</button>
        </div>
        <div className="board-main">
          <div className="board-cork" ref={area} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}>
            <div className="board-photo"><div className="photo-img" /><span>MARA LINDEN<br />VICTIM</span></div>
            <svg className="board-strings">
              {links.map((d) => {
                if (!s.evidence.includes(d.a) || !s.evidence.includes(d.b)) return null;
                const a = pos(d.a), b = pos(d.b);
                const x1 = a.x + CARD_W / 2, y1 = a.y + 10, x2 = b.x + CARD_W / 2, y2 = b.y + 10;
                const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + Math.min(60, Math.hypot(x2 - x1, y2 - y1) * 0.15);
                return <path key={d.id} d={`M${x1},${y1} Q${mx},${my} ${x2},${y2}`} className={`string ${isContradicted(d, s) ? 'contra' : ''}`} />;
              })}
            </svg>
            {s.evidence.length === 0 && <div className="board-empty">Nothing to pin yet. Go find something.</div>}
            {s.evidence.map((id) => {
              const p = pos(id); const ev = EVIDENCE[id];
              return (
                <div key={id} className={`card ${first === id ? 'sel' : ''} ${shake === id ? 'shake' : ''}`}
                  style={{ left: p.x, top: p.y, width: CARD_W, height: CARD_H, transform: `rotate(${((id.length * 7) % 7) - 3}deg)` }}
                  onPointerDown={(e) => onDown(e, id)}>
                  <span className="pin" />
                  <Icon id={id} size={40} />
                  <div><b>{ev.name}</b><small>{ev.short}</small></div>
                </div>
              );
            })}
          </div>
          <aside className="board-side">
            <h3>Deductions</h3>
            {links.length === 0 && <p className="nb-empty">No connections yet.</p>}
            {links.map((d) => (
              <div key={d.id} className={`ded cat-${d.category} ${isContradicted(d, s) ? 'contra' : ''}`}>
                <small>{d.category}{isContradicted(d, s) ? ' · contradicted' : ''}</small>
                <b>{d.title}</b>
                <p>{d.text}</p>
              </div>
            ))}
            <button className="menu-btn danger accuse" disabled={!canAccuse} onClick={() => setAccuse(true)} title={canAccuse ? '' : 'You need more than a hunch (2+ deductions).'}>
              Make Accusation
            </button>
            {!canAccuse && <small className="hint">Needs at least 2 deductions.</small>}
          </aside>
        </div>
        {accuse && (
          <div className="accuse-back">
            <div className="accuse">
              <h2>Who killed Mara Linden?</h2>
              <p>There is no taking this back. Halvorsen will make the arrest on your word alone.</p>
              <div className="accuse-grid">
                {SUSPECT_IDS.map((id) => (
                  <button key={id} className={`suspect ${target === id ? 'sel' : ''}`} onClick={() => { setTarget(id); audio.click(); }}>
                    <Portrait id={id} size={96} /><b>{CHARACTERS[id].name}</b><small>{CHARACTERS[id].role}</small>
                  </button>
                ))}
              </div>
              <div className="row">
                <button className="menu-btn ghost" onClick={() => { setAccuse(false); setTarget(null); }}>Not yet</button>
                <button className="menu-btn danger" disabled={!target} onClick={() => target && triggerEnding(resolveAccusation(target))}>
                  {target ? `Accuse ${CHARACTERS[target].name.split(' ').slice(-1)[0]}` : 'Choose a suspect'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
