import { useEffect } from 'react';
import { store } from '../systems/GameStore';
import { audio } from '../systems/AudioSystem';

export function useHotkeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = store.get();
      const tag = (e.target as HTMLElement | null)?.tagName;
      const typing = tag === 'TEXTAREA' || tag === 'INPUT';
      if (s.screen !== 'playing') return;
      if (typing && e.key !== 'Escape') return;
      const k = e.key.toLowerCase();
      if (e.key === 'Tab' || k === 'n' || k === 'j') {
        e.preventDefault();
        if (s.ui === null || s.ui === 'notebook' || s.ui === 'board') { audio.click(); store.set({ ui: s.ui === 'notebook' ? null : 'notebook' }); }
      } else if (k === 'b') {
        if (s.ui === null || s.ui === 'board' || s.ui === 'notebook') { audio.click(); store.set({ ui: s.ui === 'board' ? null : 'board' }); }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (s.ui === 'dialogue') return;
        if (s.ui === 'accuse') { store.set({ ui: 'board' }); return; }
        if (s.ui) store.closeUI(); else store.set({ ui: 'pause' });
        audio.click();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
