import { ICONS } from '../assets/icons';

export function Icon({ id, size = 48, className = '' }: { id: string; size?: number; className?: string }) {
  const src = ICONS[`ev-${id}`];
  return src ? <img className={`pix ${className}`} src={src} width={size} height={size} alt="" /> : <div className={`pix-fallback ${className}`} style={{ width: size, height: size }} />;
}
export function Portrait({ id, size = 96, className = '' }: { id: string; size?: number; className?: string }) {
  const src = ICONS[`portrait-${id}`];
  return src ? <img className={`pix portrait ${className}`} src={src} width={size} height={size} alt="" /> : <div className={`pix-fallback ${className}`} style={{ width: size, height: size }} />;
}
