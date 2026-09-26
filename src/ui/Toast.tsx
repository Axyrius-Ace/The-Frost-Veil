import { useGame } from './useGame';

export function Toast() {
  const s = useGame();
  if (!s.toast) return null;
  return <div key={s.toast.id} className="toast">{s.toast.text}</div>;
}
