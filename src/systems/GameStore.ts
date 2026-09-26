import { EVIDENCE } from '../data/story';
import { START } from '../data/areas';
import { loadSettings, pickPersisted, readSave, saveSettings, writeSave, type Persisted } from './SaveSystem';

export type UIPanel = null | 'dialogue' | 'notebook' | 'board' | 'pause' | 'inspect' | 'accuse';
export type Screen = 'title' | 'playing' | 'ending';

export interface InspectData { title: string; text: string; tag?: string; }

export interface GameState {
  screen: Screen;
  ui: UIPanel;
  battery: number;
  flashlightOn: boolean;
  evidence: string[];
  flags: string[];
  deductions: string[];
  wrongLinks: number;
  notes: string;
  journal: { t: number; text: string }[];
  area: string;
  player: { x: number; y: number };
  collected: string[];
  dialogue: { npc: string; node: string } | null;
  inspect: InspectData | null;
  prompt: string | null;
  toast: { id: number; text: string } | null;
  banner: { id: number; text: string } | null;
  endingId: string | null;
  accused: string | null;
  playTime: number;
  boardPos: Record<string, { x: number; y: number }>;
  settings: { master: number; music: number };
}

const fresh = (): GameState => ({
  screen: 'title', ui: null, battery: 55, flashlightOn: true,
  evidence: [], flags: [], deductions: [], wrongLinks: 0, notes: '', journal: [],
  area: START.area, player: { x: START.x, y: START.y }, collected: [],
  dialogue: null, inspect: null, prompt: null, toast: null, banner: null,
  endingId: null, accused: null, playTime: 0, boardPos: {}, settings: loadSettings(),
});

type Listener = () => void;

class GameStore {
  state: GameState = fresh();
  private listeners = new Set<Listener>();
  private counter = 0;
  private lockT = 0;

  /** Briefly ignore world input so the key that closed a panel doesn't re-trigger an interaction. */
  lock(ms = 250) { this.lockT = performance.now() + ms; }
  locked() { return performance.now() < this.lockT; }

  get = (): GameState => this.state;
  subscribe = (l: Listener) => { this.listeners.add(l); return () => { this.listeners.delete(l); }; };

  set(patch: Partial<GameState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach(l => l());
  }
  /** Mutate without notifying React: for per-frame values like player position. */
  silent(patch: Partial<GameState>) { Object.assign(this.state, patch); }

  has(key: string) {
    const s = this.state;
    return s.evidence.includes(key) || s.flags.includes(key) || s.deductions.includes(key);
  }

  toast(text: string) { this.set({ toast: { id: ++this.counter, text } }); }
  banner(text: string) { this.set({ banner: { id: ++this.counter, text } }); }
  log(text: string) { this.set({ journal: [...this.state.journal, { t: this.state.playTime, text }] }); }

  addEvidence(id: string) {
    if (this.state.evidence.includes(id)) return false;
    const ev = EVIDENCE[id];
    this.set({ evidence: [...this.state.evidence, id] });
    if (ev) { this.log(`${ev.kind === 'testimony' ? 'Testimony' : 'Evidence'}: ${ev.name}.`); this.toast(`New ${ev.kind === 'testimony' ? 'testimony' : 'evidence'}: ${ev.name}`); }
    this.autosave();
    return true;
  }
  addFlag(f: string) { if (!this.state.flags.includes(f)) this.set({ flags: [...this.state.flags, f] }); }
  addDeduction(id: string) {
    if (this.state.deductions.includes(id)) return;
    this.set({ deductions: [...this.state.deductions, id] });
    this.autosave();
  }
  collect(id: string) { if (!this.state.collected.includes(id)) this.set({ collected: [...this.state.collected, id] }); }

  openUI(ui: UIPanel) { this.set({ ui }); }
  closeUI() { this.lock(); this.set({ ui: null, dialogue: null, inspect: null }); }

  newGame() {
    const settings = this.state.settings;
    this.state = { ...fresh(), settings, screen: 'playing' };
    this.listeners.forEach(l => l());
  }

  save(slot: string) { return writeSave(slot, this.state); }
  autosave() { if (this.state.screen === 'playing') writeSave('auto', this.state); }

  load(slot: string): boolean {
    const data: Persisted | null = readSave(slot);
    if (!data) return false;
    this.state = { ...fresh(), ...data, settings: this.state.settings, screen: 'playing', ui: null };
    this.listeners.forEach(l => l());
    return true;
  }

  snapshot() { return pickPersisted(this.state); }

  setSettings(s: Partial<GameState['settings']>) {
    const settings = { ...this.state.settings, ...s };
    saveSettings(settings);
    this.set({ settings });
  }

  toTitle() { this.set({ screen: 'title', ui: null, dialogue: null, inspect: null, prompt: null }); }
}

export const store = new GameStore();
