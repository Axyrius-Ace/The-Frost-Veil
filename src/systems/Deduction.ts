import { CORE_DEDUCTIONS, DEDUCTIONS } from '../data/story';

export function findDeduction(a: string, b: string) {
  return DEDUCTIONS.find(d => (d.a === a && d.b === b) || (d.a === b && d.b === a)) ?? null;
}

export function suspectStatus(id: string, known: string[]) {
  const ds = DEDUCTIONS.filter(d => known.includes(d.id));
  return { implicated: ds.filter(d => d.implicates === id).length, cleared: ds.some(d => d.clears === id) };
}

export function resolveEnding(accused: string, known: string[]): string {
  switch (accused) {
    case 'accident': return 'white_silence';
    case 'viktor': return 'wrong_door';
    case 'tomas': return 'frozen_blood';
    case 'ilse': {
      const core = CORE_DEDUCTIONS.filter(d => known.includes(d)).length;
      if (core === CORE_DEDUCTIONS.length) return 'veil_lifts';
      const any = DEDUCTIONS.filter(d => d.implicates === 'ilse' && known.includes(d.id)).length;
      return any > 0 ? 'thin_ice' : 'hunch';
    }
    default: return 'white_silence';
  }
}
