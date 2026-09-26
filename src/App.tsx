import { GameCanvas } from './components/GameCanvas';
import { TouchControls } from './components/TouchControls';
import { useGame } from './ui/useGame';
import { useHotkeys } from './ui/hotkeys';
import { TitleScreen } from './ui/TitleScreen';
import { HUD } from './ui/HUD';
import { DialogueBox } from './ui/DialogueBox';
import { Notebook } from './ui/Notebook';
import { InvestigationBoard } from './ui/InvestigationBoard';
import { PauseMenu } from './ui/PauseMenu';
import { InspectModal } from './ui/InspectModal';
import { AccuseModal } from './ui/AccuseModal';
import { EndingScreen } from './ui/EndingScreen';
import { Toast } from './ui/Toast';

export default function App() {
  const s = useGame();
  useHotkeys();
  return (
    <div className="root">
      <GameCanvas />
      <div className="ui-layer">
        {s.screen === 'title' && <TitleScreen />}
        {s.screen === 'playing' && <HUD />}
        {s.screen === 'playing' && <TouchControls />}
        {s.screen === 'playing' && s.ui === 'dialogue' && <DialogueBox />}
        {s.screen === 'playing' && s.ui === 'notebook' && <Notebook />}
        {s.screen === 'playing' && s.ui === 'board' && <InvestigationBoard />}
        {s.screen === 'playing' && s.ui === 'pause' && <PauseMenu />}
        {s.screen === 'playing' && s.ui === 'inspect' && <InspectModal />}
        {s.screen === 'playing' && s.ui === 'accuse' && <AccuseModal />}
        {s.screen === 'ending' && <EndingScreen />}
        <Toast />
      </div>
    </div>
  );
}
