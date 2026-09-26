import { getState, setState, initialState, PERSIST_KEYS, GameState, toast } from './store';

const PREFIX = 'frostveil.save.';
const ENDINGS_KEY = 'frostveil.endings';
export type Slot = 'auto' | '1' | '2' | '3';
export const SLOTS: Slot[] = ['auto', '1', '2', '3'];

export interface SaveMeta { slot: Slot; savedAt: number; areaName: string; evidence: number; deductions: number; playTime: number }
interface SaveFile { v: 1; savedAt: number; state: Partial<GameState> }

export function saveGame(slot: Slot, quiet = false) {
  try {
    const s = getState();
    const data: SaveFile = { v: 1, savedAt: Date.now(), state: {} };
    for (const k of PERSIST_KEYS) (data.state as any)[k] = s[k];
    localStorage.setItem(PREFIX + slot, JSON.stringify(data));
    if (!quiet) toast(slot === 'auto' ? 'Autosaved.' : `Saved to slot ${slot}.`, 'info');
    return true;
  } catch {
    toast('Could not save (storage unavailable).', 'warn');
    return false;
  }
}

export function loadGame(slot: Slot) {
  const raw = localStorage.getItem(PREFIX + slot);
  if (!raw) return false;
  try {
    const data = JSON.parse(raw) as SaveFile;
    setState({ ...initialState(), booted: true, ...data.state, mode: 'playing', modeChangedAt: performance.now() });
    return true;
  } catch { return false; }
}

export function saveMeta(slot: Slot): SaveMeta | null {
  const raw = localStorage.getItem(PREFIX + slot);
  if (!raw) return null;
  try {
    const d = JSON.parse(raw) as SaveFile;
    return { slot, savedAt: d.savedAt, areaName: d.state.areaName ?? 'Hollowpine', evidence: d.state.evidence?.length ?? 0, deductions: d.state.deductions?.length ?? 0, playTime: d.state.playTime ?? 0 };
  } catch { return null; }
}

export function hasSave(slot: Slot) { return !!localStorage.getItem(PREFIX + slot); }
export function deleteSave(slot: Slot) { localStorage.removeItem(PREFIX + slot); }

export function unlockedEndings(): string[] {
  try { return JSON.parse(localStorage.getItem(ENDINGS_KEY) ?? '[]'); } catch { return []; }
}
export function unlockEnding(id: string) {
  const list = unlockedEndings(); if (!list.includes(id)) list.push(id);
  localStorage.setItem(ENDINGS_KEY, JSON.stringify(list));
}
export function formatTime(sec: number) {
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
