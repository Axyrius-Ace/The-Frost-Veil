import { getState, setState, initialState, PERSIST_KEYS, GameState, toast } from './store';

const PREFIX = 'frostveil.save.';
const ENDINGS_KEY = 'frostveil.endings';
export type Slot = 'auto' | '1' | '2' | '3';
export const SLOTS: Slot[] = ['auto', '1', '2', '3'];
export interface SaveMeta { slot: Slot; savedAt: number; areaName: string; evidence: number; deductions: number; playTime: number }
interface SaveFile { v: 1; savedAt: number; state: Partial<GameState> }

function read(key: string): string | null { try { return localStorage.getItem(key); } catch { return null; } }
function write(key: string, value: string): boolean { try { localStorage.setItem(key, value); return true; } catch { return false; } }
function remove(key: string) { try { localStorage.removeItem(key); } catch { /* storage can be unavailable in WebView/private mode */ } }
function validState(s: unknown): s is Partial<GameState> {
  if (!s || typeof s !== 'object') return false;
  const x = s as Partial<GameState>;
  return (x.evidence === undefined || Array.isArray(x.evidence)) && (x.deductions === undefined || Array.isArray(x.deductions)) && (x.talkedTo === undefined || Array.isArray(x.talkedTo)) && (x.pickups === undefined || Array.isArray(x.pickups)) && (x.journal === undefined || Array.isArray(x.journal)) && (x.flags === undefined || typeof x.flags === 'object') && (x.player === undefined || (typeof x.player === 'object' && typeof x.player.x === 'number' && typeof x.player.y === 'number'));
}
function parse(slot: Slot): SaveFile | null {
  const raw = read(PREFIX + slot); if (!raw) return null;
  try { const d = JSON.parse(raw) as SaveFile; return d?.v === 1 && typeof d.savedAt === 'number' && validState(d.state) ? d : null; } catch { return null; }
}

export function saveGame(slot: Slot, quiet = false) {
  const s = getState(); const data: SaveFile = { v: 1, savedAt: Date.now(), state: {} };
  for (const k of PERSIST_KEYS) (data.state as any)[k] = s[k];
  if (!write(PREFIX + slot, JSON.stringify(data))) { toast('Could not save (storage unavailable).', 'warn'); return false; }
  if (!quiet) toast(slot === 'auto' ? 'Autosaved.' : `Saved to slot ${slot}.`, 'info');
  return true;
}

export function loadGame(slot: Slot) { const data = parse(slot); if (!data) return false; setState({ ...initialState(), booted: true, ...data.state, mode: 'playing', modeChangedAt: performance.now() }); return true; }
export function saveMeta(slot: Slot): SaveMeta | null { const d = parse(slot); if (!d) return null; return { slot, savedAt: d.savedAt, areaName: d.state.areaName ?? 'Hollowpine', evidence: d.state.evidence?.length ?? 0, deductions: d.state.deductions?.length ?? 0, playTime: d.state.playTime ?? 0 }; }
export function hasSave(slot: Slot) { return !!read(PREFIX + slot); }
export function deleteSave(slot: Slot) { remove(PREFIX + slot); }
export function unlockedEndings(): string[] { const raw = read(ENDINGS_KEY); if (!raw) return []; try { const d = JSON.parse(raw); return Array.isArray(d) && d.every((x) => typeof x === 'string') ? d : []; } catch { return []; } }
export function unlockEnding(id: string) { const list = unlockedEndings(); if (!list.includes(id)) list.push(id); write(ENDINGS_KEY, JSON.stringify(list)); }
export function formatTime(sec: number) { const m = Math.floor(sec / 60), s = Math.floor(sec % 60); return `${m}:${String(s).padStart(2, '0')}`; }
