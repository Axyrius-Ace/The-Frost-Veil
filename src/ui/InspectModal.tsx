import { useEffect } from 'react';
import { useGame } from './useGame';
import { store } from '../systems/GameStore';
import { audio } from '../systems/AudioSystem';

export function InspectModal() {
  const s = useGame();
  const d = s.inspect;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (['e', 'E', 'Enter', ' '].includes(e.key)) { e.preventDefault(); audio.click(); store.closeUI(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  if (!d) return null;
  return (
    <div className="modal-backdrop" onClick={() => store.closeUI()}>
      <div className="inspect" onClick={e => e.stopPropagation()}>
        {d.tag && <div className="inspect-tag">{d.tag}</div>}
        <h2>{d.title}</h2>
        <p className="inspect-text">{d.text}</p>
        <button className="btn" onClick={() => { audio.click(); store.closeUI(); }}><span className="key">E</span> Continue</button>
      </div>
    </div>
  );
}
