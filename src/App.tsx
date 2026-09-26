import { useEffect, useRef } from 'react';
import type Phaser from 'phaser';
import { createGame } from './scenes/createGame';
import { useGame, getState, setMode, setState } from './systems/store';
import { audio } from './systems/audio';
import { HUD } from './components/HUD';
import { TitleMenu } from './components/TitleMenu';
import { Intro } from './components/Intro';
import { DialogueBox } from './components/DialogueBox';
import { InspectCard } from './components/InspectCard';
import { Notebook } from './components/Notebook';
import { Board } from './components/Board';
import { PauseMenu } from './components/PauseMenu';
import { ConfirmModal } from './components/ConfirmModal';
import { EndingScreen } from './components/EndingScreen';
import { Toasts } from './components/Toasts';
import { TouchControls } from './components/TouchControls';

let game: Phaser.Game | null = null;

export default function App() {
  const s = useGame();
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!game && host.current) game = createGame(host.current); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const st = getState(); const k = e.key.toLowerCase();
      if (k === 'tab') e.preventDefault();
      if (k === 'm' && st.mode !== 'title') { const m = !st.muted; setState({ muted: m }); audio.setMuted(m); return; }
      switch (st.mode) {
        case 'playing':
          if (k === 'j' || k === 'tab') { setMode('notebook'); audio.page(); }
          else if (k === 'b') { setMode('board'); audio.page(); }
          else if (k === 'escape' || k === 'p') setMode('paused');
          break;
        case 'notebook': if (k === 'j' || k === 'tab' || k === 'escape') { setMode('playing'); audio.page(); } break;
        case 'board': if (k === 'b' || k === 'escape') { setMode('playing'); audio.page(); } break;
        case 'paused': if (k === 'escape' || k === 'p') setMode('playing'); break;
        case 'confirm': if (k === 'escape') { setState({ confirm: null }); setMode('playing'); } break;
        case 'inspect': if (['e', 'escape', ' ', 'enter'].includes(k)) setMode('playing'); break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const inGame = !['title', 'intro', 'ending'].includes(s.mode);
  return (
    <div className="app">
      <div ref={host} className="game-host" />
      <div className="fx-vignette" />
      <div className="fx-frost" />
      <div className="fx-grain" />
      {inGame && <HUD />}
      {s.mode === 'title' && <TitleMenu />}
      {s.mode === 'intro' && <Intro />}
      {s.mode === 'dialogue' && <DialogueBox />}
      {s.mode === 'inspect' && <InspectCard />}
      {s.mode === 'notebook' && <Notebook />}
      {s.mode === 'board' && <Board />}
      {s.mode === 'paused' && <PauseMenu />}
      {s.mode === 'confirm' && <ConfirmModal />}
      {s.mode === 'ending' && <EndingScreen />}
      <Toasts />
      <TouchControls />
    </div>
  );
}
