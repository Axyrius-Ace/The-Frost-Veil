import { DIALOGUES, Cond, Effect } from '../data/dialogue';
import { getState, setFlag, addEvidence, journal } from './store';

export function check(c?: Cond): boolean {
  if (!c) return true;
  const s = getState();
  if (c.ev && !c.ev.every((e) => s.evidence.includes(e))) return false;
  if (c.notEv && c.notEv.some((e) => s.evidence.includes(e))) return false;
  if (c.ded && !c.ded.every((d) => s.deductions.includes(d))) return false;
  if (c.flags && !c.flags.every((f) => s.flags[f])) return false;
  if (c.not && c.not.some((f) => s.flags[f])) return false;
  return true;
}

export function resolveStart(npc: string): string {
  const tree = DIALOGUES[npc];
  for (const r of tree.start) if (check(r.cond)) return r.node;
  return tree.start[tree.start.length - 1].node;
}

export function applyEffects(effects?: Effect[]) {
  if (!effects) return;
  for (const e of effects) {
    if (e.flag) setFlag(e.flag);
    if (e.note) journal(e.note);
    if (e.evidence) addEvidence(e.evidence, { silent: true });
  }
}
