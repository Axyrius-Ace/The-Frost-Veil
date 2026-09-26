import { useSyncExternalStore } from 'react';
import { audio } from './audio';
import { EVIDENCE } from '../data/evidence';
import { DEDUCTIONS } from '../data/deductions';
import { SPAWN } from '../data/world';

export type Mode = 'title' | 'intro' | 'playing' | 'dialogue' | 'inspect' | 'notebook' | 'board' | 'paused' | 'confirm' | 'ending';
export type ToastKind = 'info' | 'evidence' | 'deduction' | 'warn' | 'thought';
export interface Toast { id: number; text: string; kind: ToastKind }
export interface JournalEntry { time: number; text: string }

export interface GameState {
  booted: boolean;
  mode: Mode;
  modeChangedAt: number;
  battery: number;
  flashlightOn: boolean;
  evidence: string[];
  deductions: string[];
  flags: Record<string, boolean>;
  journal: JournalEntry[];
  talkedTo: string[];
  dialogue: { npc: string; node: string } | null;
  inspect: string | null;
  prompt: string | null;
  toasts: Toast[];
  ending: string | null;
  area: string;
  areaName: string;
  player: { x: number; y: number };
  pickups: string[];
  boardPos: Record<string, { x: number; y: number }>;
  playTime: number;
  confirm: { title: string; text: string; action: 'leave' } | null;
  muted: boolean;
}

export const PERSIST_KEYS: (keyof GameState)[] = [
  'battery', 'flashlightOn', 'evidence', 'deductions', 'flags', 'journal', 'talkedTo',
  'area', 'areaName', 'player', 'pickups', 'boardPos', 'playTime',
];

export function initialState(): GameState {
  return {
    booted: state?.booted ?? false,
    mode: 'title', modeChangedAt: 0,
    battery: 100, flashlightOn: false,
    evidence: [], deductions: [], flags: {}, journal: [], talkedTo: [],
    dialogue: null, inspect: null, prompt: null, toasts: [], ending: null,
    area: SPAWN.area, areaName: 'Hollowpine', player: { x: SPAWN.x, y: SPAWN.y },
    pickups: [], boardPos: {}, playTime: 0, confirm: null, muted: state?.muted ?? false,
  };
}

// eslint-disable-next-line prefer-const
let state: GameState = undefined as unknown as GameState;
state = initialState();
const listeners = new Set<() => void>();

export const getState = () => state;
export function setState(p: Partial<GameState> | ((s: GameState) => Partial<GameState>)) {
  const patch = typeof p === 'function' ? p(state) : p;
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}
export function subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }
export function useGame() { return useSyncExternalStore(subscribe, getState); }

export function resetState() { state = { ...initialState(), booted: state.booted }; listeners.forEach((l) => l()); }

export function setMode(mode: Mode) {
  setState({ mode, modeChangedAt: performance.now(), prompt: mode === 'playing' ? state.prompt : null });
}

let toastId = 0;
export function toast(text: string, kind: ToastKind = 'info') {
  const id = ++toastId;
  setState((s) => ({ toasts: [...s.toasts.slice(-3), { id, text, kind }] }));
  window.setTimeout(() => setState((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), kind === 'thought' ? 5600 : 3800);
}

export function journal(text: string) {
  if (state.journal.some((j) => j.text === text)) return;
  setState((s) => ({ journal: [...s.journal, { time: s.playTime, text }] }));
}

export function setFlag(key: string, value = true) {
  if (!!state.flags[key] === value) return;
  setState((s) => ({ flags: { ...s.flags, [key]: value } }));
}

export function addEvidence(id: string, opts: { silent?: boolean } = {}) {
  if (state.evidence.includes(id)) return false;
  const ev = EVIDENCE[id];
  setState((s) => ({ evidence: [...s.evidence, id] }));
  journal(`Evidence logged: ${ev.name}.`);
  audio.clue();
  if (opts.silent) toast(`Evidence: ${ev.name}`, 'evidence');
  else { setState({ inspect: id }); setMode('inspect'); }
  return true;
}

export function addDeduction(id: string) {
  if (state.deductions.includes(id)) return false;
  const d = DEDUCTIONS.find((x) => x.id === id);
  if (!d) return false;
  setState((s) => ({ deductions: [...s.deductions, id] }));
  journal(`Deduced: ${d.title}.`);
  audio.deduction();
  toast(`Deduction: ${d.title}`, 'deduction');
  return true;
}
