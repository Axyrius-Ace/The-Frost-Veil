import { useGame, setMode } from '../systems/store';
import { EVIDENCE } from '../data/evidence';
import { Icon } from './common';

export function InspectCard() {
  const s = useGame();
  const ev = s.inspect ? EVIDENCE[s.inspect] : null;
  if (!ev) return null;
  return (
    <div className="modal-back" onClick={() => setMode('playing')}>
      <div className="inspect" onClick={(e) => e.stopPropagation()}>
        <div className="inspect-kicker">{ev.hidden ? 'HIDDEN EVIDENCE REVEALED' : 'EVIDENCE COLLECTED'}</div>
        <div className="inspect-icon"><Icon id={ev.id} size={120} /></div>
        <h2>{ev.name}</h2>
        <p>{ev.description}</p>
        <div className="inspect-loc">Found: {ev.location}</div>
        <button className="menu-btn primary" onClick={() => setMode('playing')}>Add to notebook <kbd>E</kbd></button>
      </div>
    </div>
  );
}
