import { useGame } from '../systems/store';

export function Toasts() {
  const { toasts } = useGame();
  return (
    <div className="toasts">
      {toasts.map((t) => <div key={t.id} className={`toast toast-${t.kind}`}>{t.kind === 'thought' ? <em>{t.text}</em> : t.text}</div>)}
    </div>
  );
}
