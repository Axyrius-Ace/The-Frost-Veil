import { useEffect, useRef } from 'react';
import { createGame, destroyGame } from '../systems/PhaserGame';

/** Hosts the Phaser canvas. Created once; React overlays sit above it in .ui-layer. */
export function GameCanvas() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (host.current) createGame(host.current);
    return () => destroyGame();
  }, []);
  return <div className="game-host" ref={host} />;
}
