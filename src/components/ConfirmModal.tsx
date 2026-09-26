import { useGame, setMode, setState } from '../systems/store';
import { triggerEnding } from '../systems/investigation';

export function ConfirmModal() {
  const s = useGame();
  const c = s.confirm;
  if (!c) return null;
  const cancel = () => { setState({ confirm: null }); setMode('playing'); };
  const ok = () => { if (c.action === 'leave') triggerEnding('whiteout'); };
  return (
    <div className="modal-back" onClick={cancel}>
      <div className="confirm" onClick={(e) => e.stopPropagation()}>
        <h2>{c.title}</h2>
        <p>{c.text}</p>
        <div className="row">
          <button className="menu-btn ghost" onClick={cancel}>Stay in Hollowpine</button>
          <button className="menu-btn danger" onClick={ok}>Board the bus</button>
        </div>
      </div>
    </div>
  );
}
