import { useRef, useState } from 'react';
import type { PointerEvent as RPointerEvent } from 'react';
import { useGame } from './useGame';
import { store } from '../systems/GameStore';
import { audio } from '../systems/AudioSystem';
import { EVIDENCE, DEDUCTIONS } from '../data/story';
import { findDeduction } from '../systems/Deduction';

const BW = 1000, BH = 600, CW = 150, CH = 92;
const defaultPos = (i: number) => ({ x: 30 + (i % 6) * 160, y: 30 + Math.floor(i / 6) * 140 + (i % 2) * 18 });

export function InvestigationBoard() {
  const s = useGame();
  const [sel, setSel] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ id: number; text: string; ok: boolean } | null>(null);
  const board = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; dx: number; dy: number; sx: number; sy: number; moved: boolean } | null>(null);

  const pos = (id: string) => s.boardPos[id] ?? defaultPos(s.evidence.indexOf(id));
  const scale = () => (board.current ? board.current.getBoundingClientRect().width / BW : 1);

  const tryLink = (a: string, b: string) => {
    const d = findDeduction(a, b);
    if (d) {
      if (store.has(d.id)) setFlash({ id: Date.now(), text: `Already on the board: ${d.title}`, ok: true });
      else { store.addDeduction(d.id); audio.connect(); setFlash({ id: Date.now(), text: `Deduction: ${d.title}`, ok: true }); }
    } else {
      store.set({ wrongLinks: store.get().wrongLinks + 1 }); audio.fail();
      setFlash({ id: Date.now(), text: 'That thread leads nowhere.', ok: false });
    }
  };

  const onDown = (e: RPointerEvent, id: string) => {
    const rect = board.current!.getBoundingClientRect(); const k = scale(); const p = pos(id);
    drag.current = { id, dx: (e.clientX - rect.left) / k - p.x, dy: (e.clientY - rect.top) / k - p.y, sx: e.clientX, sy: e.clientY, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: RPointerEvent) => {
    const dr = drag.current; if (!dr) return;
    if (!dr.moved && Math.hypot(e.clientX - dr.sx, e.clientY - dr.sy) < 5) return;
    dr.moved = true;
    const rect = board.current!.getBoundingClientRect(); const k = scale();
    const x = Math.max(0, Math.min(BW - CW, (e.clientX - rect.left) / k - dr.dx));
    const y = Math.max(0, Math.min(BH - CH, (e.clientY - rect.top) / k - dr.dy));
    store.set({ boardPos: { ...store.get().boardPos, [dr.id]: { x, y } } });
  };
  const onUp = () => {
    const dr = drag.current; drag.current = null;
    if (!dr || dr.moved) return;
    audio.click();
    if (!sel) setSel(dr.id);
    else if (sel === dr.id) setSel(null);
    else { tryLink(sel, dr.id); setSel(null); }
  };

  const links = DEDUCTIONS.filter(d => s.deductions.includes(d.id) && s.evidence.includes(d.a) && s.evidence.includes(d.b));
  const center = (id: string) => { const p = pos(id); return { x: p.x + CW / 2, y: p.y + 10 }; };
  const canAccuse = s.deductions.length >= 2;

  return (
    <div className="modal-backdrop">
      <div className="board-wrap">
        <header className="board-head">
          <h2>Investigation Board</h2>
          <p>Click one clue, then another, to connect them. Drag cards to arrange.</p>
          <button className="x" onClick={() => store.closeUI()}>✕</button>
        </header>
        <div className="board-main">
          <div className="board" ref={board} style={{ aspectRatio: `${BW} / ${BH}` }}>
            <svg className="strings" viewBox={`0 0 ${BW} ${BH}`} preserveAspectRatio="none">
              {links.map(d => { const a = center(d.a), b = center(d.b); const my = (a.y + b.y) / 2 + 30;
                return <path key={d.id} d={`M${a.x},${a.y} Q${(a.x + b.x) / 2},${my} ${b.x},${b.y}`} className={`string ${d.clears ? 'clear' : ''}`} />; })}
            </svg>
            {s.evidence.length === 0 && <div className="board-empty">The board is empty. Go find something.</div>}
            {s.evidence.map(id => {
              const ev = EVIDENCE[id]; const p = pos(id);
              return (
                <div key={id} className={`card ${ev.kind} ${sel === id ? 'selected' : ''}`}
                  style={{ left: `${(p.x / BW) * 100}%`, top: `${(p.y / BH) * 100}%`, width: `${(CW / BW) * 100}%`, height: `${(CH / BH) * 100}%` }}
                  onPointerDown={e => onDown(e, id)} onPointerMove={onMove} onPointerUp={onUp}>
                  <i className="pin" />
                  <div className="card-ico">{ev.icon}</div>
                  <div className="card-name">{ev.name}</div>
                  <div className="card-kind">{ev.kind}</div>
                </div>
              );
            })}
            {flash && <div key={flash.id} className={`board-flash ${flash.ok ? 'ok' : 'bad'}`}>{flash.text}</div>}
          </div>
          <aside className="board-side">
            <h4>Deductions <small>{s.deductions.length}/{DEDUCTIONS.length}</small></h4>
            <div className="ded-scroll">
              {s.deductions.length === 0 && <p className="empty">Link two related clues to deduce something.</p>}
              {DEDUCTIONS.filter(d => s.deductions.includes(d.id)).map(d => (
                <div key={d.id} className={`ded ${d.implicates ? 'imp' : d.clears ? 'clr' : ''}`}><b>{d.title}</b><p>{d.text}</p></div>
              ))}
            </div>
            <button className="btn danger" disabled={!canAccuse} onClick={() => { audio.click(); store.set({ ui: 'accuse' }); }}>
              Make an Accusation
            </button>
            {!canAccuse && <p className="hint">Form at least two deductions first.</p>}
          </aside>
        </div>
      </div>
    </div>
  );
}
