import { useState } from 'react';
import { AREAS } from '../data/areas';
import { readMeta, SAVE_SLOTS } from '../systems/SaveSystem';

const fmtTime = (s: number) => `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;

export function SaveSlots({ mode, onPick, includeAuto = false }: { mode: 'save' | 'load'; onPick: (slot: string) => void; includeAuto?: boolean }) {
  const [, force] = useState(0);
  const slots = [...(includeAuto ? ['auto'] : []), ...SAVE_SLOTS];
  return (
    <div className="slots">
      {slots.map(slot => {
        const m = readMeta(slot);
        const disabled = mode === 'load' && !m;
        return (
          <button key={slot} className="slot" disabled={disabled} onClick={() => { onPick(slot); force(x => x + 1); }}>
            <span className="slot-name">{slot === 'auto' ? 'Autosave' : `Slot ${slot}`}</span>
            {m ? (
              <span className="slot-meta">
                {AREAS[m.area]?.name ?? m.area} · {m.evidence} clues · {m.deductions} deductions · {fmtTime(m.playTime)}
                <em>{new Date(m.savedAt).toLocaleString()}</em>
              </span>
            ) : <span className="slot-meta empty">Empty</span>}
          </button>
        );
      })}
    </div>
  );
}
