import { useEffect, useState } from 'react';

export function useTypewriter(text: string, cps = 55) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const count = Math.min(text.length, Math.floor(((t - start) / 1000) * cps));
      setN(count);
      if (count < text.length) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, cps]);
  const done = n >= text.length;
  return { shown: text.slice(0, n), done, skip: () => setN(text.length) };
}
