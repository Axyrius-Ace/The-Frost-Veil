import type { GameState } from './GameStore';

export const SAVE_SLOTS = ['1', '2', '3'] as const;
const KEY = (slot: string) => `frostveil.save.${slot}`;
const VERSION = 1;

export const PERSIST_KEYS = [
  'battery', 'flashlightOn', 'evidence', 'flags', 'deductions', 'wrongLinks', 'notes', 'journal',
  'area', 'player', 'collected', 'playTime', 'boardPos',
] as const;
export type Persisted = Pick<GameState, typeof PERSIST_KEYS[number]>;

export interface SaveMeta { slot: string; savedAt: number; area: string; playTime: number; evidence: number; deductions: number; }

export function pickPersisted(s: GameState): Persisted {
  const out: Record<string, unknown> = {};
  for (const k of PERSIST_KEYS) out[k] = JSON.parse(JSON.stringify(s[k]));
  return out as Persisted;
}

export function writeSave(slot: string, s: GameState): boolean {
  try {
    localStorage.setItem(KEY(slot), JSON.stringify({ version: VERSION, savedAt: Date.now(), data: pickPersisted(s) }));
    return true;
  } catch { return false; }
}

function raw(slot: string): { version: number; savedAt: number; data: Persisted } | null {
  try {
    const txt = localStorage.getItem(KEY(slot));
    if (!txt) return null;
    const parsed = JSON.parse(txt);
    if (!parsed || parsed.version !== VERSION || !parsed.data) return null;
    return parsed;
  } catch { return null; }
}

export function readSave(slot: string): Persisted | null { return raw(slot)?.data ?? null; }

export function readMeta(slot: string): SaveMeta | null {
  const r = raw(slot);
  if (!r) return null;
  return { slot, savedAt: r.savedAt, area: r.data.area, playTime: r.data.playTime, evidence: r.data.evidence.length, deductions: r.data.deductions.length };
}

export function deleteSave(slot: string) { try { localStorage.removeItem(KEY(slot)); } catch { /* ignore */ } }

export function loadSettings(): { master: number; music: number } {
  try {
    const s = JSON.parse(localStorage.getItem('frostveil.settings') || 'null');
    if (s && typeof s.master === 'number') return s;
  } catch { /* ignore */ }
  return { master: 0.8, music: 0.7 };
}
export function saveSettings(s: { master: number; music: number }) {
  try { localStorage.setItem('frostveil.settings', JSON.stringify(s)); } catch { /* ignore */ }
}
