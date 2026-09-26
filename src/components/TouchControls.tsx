import { useEffect, useRef, useState } from 'react';
import { touchInput, isTouchDevice } from '../systems/TouchInput';
import { store } from '../systems/GameStore';
import { audio } from '../systems/AudioSystem';
import { useGame } from '../ui/useGame';

const STICK_R = 52;

export function TouchControls() {
  const s = useGame();
  const [enabled] = useState(isTouchDevice);
  const [run, setRun] = useState(false);
  const zoneRef = useRef<HTMLDivElement>(null);
  const [stick, setStick] = useState<{ dx: number; dy: number; id: number } | null>(null);
  const originRef = useRef<{ x: number; y: number; id: number } | null>(null);

  useEffect(() => {
    touchInput.run = run;
  }, [run]);

  useEffect(() => {
    touchInput.clearMove();
    touchInput.run = false;
    setRun(false);
    setStick(null);
    originRef.current = null;
  }, [s.screen, s.ui]);

  if (!enabled || s.screen !== 'playing' || s.ui !== null) return null;

  const onTouchStart = (e: React.TouchEvent) => {
    const zone = zoneRef.current;
    if (!zone || originRef.current) return;
    const t = e.changedTouches[0];
    const r = zone.getBoundingClientRect();
    originRef.current = { x: t.clientX, y: t.clientY, id: t.identifier };
    void r;
    setStick({ dx: 0, dy: 0, id: t.identifier });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const o = originRef.current;
    if (!o) return;
    for (const t of Array.from(e.changedTouches)) {
      if (t.identifier !== o.id) continue;
      let dx = (t.clientX - o.x) / STICK_R;
      let dy = (t.clientY - o.y) / STICK_R;
      const len = Math.hypot(dx, dy);
      if (len > 1) { dx /= len; dy /= len; }
      // Dead zone so resting thumbs don't drift.
      const mag = Math.hypot(dx, dy);
      const nx = mag < 0.18 ? 0 : dx;
      const ny = mag < 0.18 ? 0 : dy;
      touchInput.setMove(nx, ny);
      setStick({ dx: nx * STICK_R, dy: ny * STICK_R, id: t.identifier });
      e.preventDefault();
    }
  };

  const endTouch = (e: React.TouchEvent) => {
    const o = originRef.current;
    if (!o) return;
    for (const t of Array.from(e.changedTouches)) {
      if (t.identifier !== o.id) continue;
      originRef.current = null;
      touchInput.clearMove();
      setStick(null);
    }
  };

  const press = (fn: () => void) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fn();
  };

  return (
    <div className="touch-ui">
      <div
        ref={zoneRef}
        className="stick-zone"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={endTouch}
        onTouchCancel={endTouch}
      >
        <div className="stick-base">
          <div
            className="stick-nub"
            style={stick ? { transform: `translate(${stick.dx}px, ${stick.dy}px)` } : undefined}
          />
        </div>
      </div>
      <div className="touch-btns">
        <button
          className={`tbtn run ${run ? 'on' : ''}`}
          onTouchStart={press(() => { const v = !run; setRun(v); audio.click(); })}
          onMouseDown={press(() => { const v = !run; setRun(v); })}
        >
          RUN
        </button>
        <button
          className="tbtn flash"
          onTouchStart={press(() => touchInput.queueFlash())}
          onMouseDown={press(() => touchInput.queueFlash())}
        >
          ◉
        </button>
        <button
          className="tbtn act"
          onTouchStart={press(() => touchInput.queueInteract())}
          onMouseDown={press(() => touchInput.queueInteract())}
        >
          E
        </button>
      </div>
      <div className="touch-menu">
        <button
          className="tbtn small"
          onTouchStart={press(() => { audio.click(); store.set({ ui: 'notebook' }); })}
          onMouseDown={press(() => { audio.click(); store.set({ ui: 'notebook' }); })}
        >
          ▤
        </button>
        <button
          className="tbtn small"
          onTouchStart={press(() => { audio.click(); store.set({ ui: 'pause' }); })}
          onMouseDown={press(() => { audio.click(); store.set({ ui: 'pause' }); })}
        >
          ☰
        </button>
      </div>
    </div>
  );
}
