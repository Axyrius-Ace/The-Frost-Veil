import { useEffect, useRef } from 'react';
import { drawDetective, drawPerson, LOOKS } from '../assets/pixelArt';

export function Portrait({ who, size = 120 }: { who: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const g = c.getContext('2d')!;
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, 18, 15);
    const bg = g.createLinearGradient(0, 0, 0, 15);
    bg.addColorStop(0, '#1b2a45'); bg.addColorStop(1, '#070b16');
    g.fillStyle = bg; g.fillRect(0, 0, 18, 15);
    g.fillStyle = 'rgba(255,180,90,0.18)'; g.fillRect(12, 0, 6, 15);
    if (LOOKS[who]) drawPerson(g, 1, 1, LOOKS[who], 0);
    else drawDetective(g, 1, 1, 'down', 0);
  }, [who]);
  return <canvas ref={ref} width={18} height={15} className="portrait" style={{ width: size, height: (size * 15) / 18 }} />;
}
