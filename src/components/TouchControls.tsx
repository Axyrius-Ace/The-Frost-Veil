import { useEffect, useRef, useState } from 'react';
import { setMove, queueInteract, queueFlash, touchState } from '../systems/touch';
import { setMode, useGame } from '../systems/store';
import { audio } from '../systems/audio';

const STICK_R = 52;

function detectTouch(): boolean {
  if (typeof window === 'undefined') return false;
  if ('ontouchstart' in window) return true;
  if (navigator.maxTouchPoints > 0) return true;
  try {
    return window.matchMedia('(pointer: coarse)').matches;
  } catch {
    return false;
  }
}

export function TouchControls() {
  const baseRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef<HTMLDivElement>(null);
  const touchId = useRef<number | null>(null);
  const [run, setRun] = useState(false);
  // Lazily detected on first render so the stick exists when listeners attach.
  const [visible] = useState(detectTouch);
  const s = useGame();

  useEffect(() => {
    touchState.run = run;
  }, [run]);

  useEffect(() => {
    const base = baseRef.current;
    if (!base) return;

    const handleMove = (t: React.Touch | Touch) => {
      const rect = base.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = (t.clientX - cx) / STICK_R;
      let dy = (t.clientY - cy) / STICK_R;
      const len = Math.hypot(dx, dy);
      if (len > 1) {
        dx /= len;
        dy /= len;
      }
      setMove(dx, dy);
      if (stickRef.current) {
        stickRef.current.style.transform = `translate(${dx * STICK_R * 0.6}px, ${dy * STICK_R * 0.6}px)`;
      }
    };

    const reset = () => {
      touchId.current = null;
      setMove(0, 0);
      if (stickRef.current) stickRef.current.style.transform = 'translate(0px, 0px)';
    };

    const onTouchStart = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      touchId.current = t.identifier;
      handleMove(t);
      e.preventDefault();
    };
    const onTouchMove = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === touchId.current) {
          handleMove(t);
          e.preventDefault();
        }
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === touchId.current) reset();
      }
    };

    base.addEventListener('touchstart', onTouchStart, { passive: false });
    base.addEventListener('touchmove', onTouchMove, { passive: false });
    base.addEventListener('touchend', onTouchEnd);
    base.addEventListener('touchcancel', onTouchEnd);
    return () => {
      base.removeEventListener('touchstart', onTouchStart);
      base.removeEventListener('touchmove', onTouchMove);
      base.removeEventListener('touchend', onTouchEnd);
      base.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [visible]);

  if (!visible) return null;

  if (s.mode !== 'playing') return null;

  return (
    <div className="touch-ui">
      <div className="touch-stick" ref={baseRef}>
        <div className="touch-stick-base">
          <div className="touch-stick-nub" ref={stickRef} />
        </div>
      </div>
      <div className="touch-btns">
        <button
          className={`touch-btn ${run ? 'active' : ''}`}
          onTouchStart={(e) => {
            e.preventDefault();
            setRun((r) => !r);
          }}
        >
          RUN
        </button>
        <button
          className="touch-btn"
          onTouchStart={(e) => {
            e.preventDefault();
            queueFlash();
          }}
        >
          🔦
        </button>
        <button
          className="touch-btn big"
          onTouchStart={(e) => {
            e.preventDefault();
            queueInteract();
          }}
        >
          E
        </button>
      </div>
      <div className="touch-top">
        <button
          className="touch-chip"
          onTouchStart={(e) => {
            e.preventDefault();
            setMode('notebook');
            audio.page();
          }}
        >
          📓
        </button>
        <button
          className="touch-chip"
          onTouchStart={(e) => {
            e.preventDefault();
            setMode('board');
            audio.page();
          }}
        >
          📌
        </button>
        <button
          className="touch-chip"
          onTouchStart={(e) => {
            e.preventDefault();
            setMode('paused');
          }}
        >
          ⏸
        </button>
      </div>
    </div>
  );
}
