import { findDeduction, DEDUCTIONS, Deduction } from '../data/deductions';
import { getState, addDeduction, GameState, setState, setMode } from './store';
import { unlockEnding } from './save';
import { audio } from './audio';
import { ENDINGS } from '../data/endings';

export function tryConnect(a: string, b: string): Deduction | null {
  if (a === b) return null;
  const d = findDeduction(a, b);
  if (!d) return null;
  addDeduction(d.id);
  return d;
}

export function isContradicted(d: Deduction, s: GameState = getState()) {
  return !!d.contradictedBy?.some((f) => s.flags[f]);
}

export function resolveAccusation(suspect: string): string {
  const s = getState();
  if (suspect === 'brandt') {
    const full = ['drugged', 'motive', 'path'].every((d) => s.deductions.includes(d));
    return full ? 'true_thaw' : 'thin_ice';
  }
  return `wrong_${suspect}`;
}

export function triggerEnding(id: string) {
  unlockEnding(id);
  setState({ ending: id, dialogue: null, confirm: null });
  setMode('ending');
  audio.sting(ENDINGS[id]?.tone === 'true' ? 'true' : 'dark');
}

export function objective(s: GameState): string {
  if (!s.flags.met_sheriff) return 'Find Sheriff Halvorsen in the town square.';
  const scene = ['stopped_watch', 'syringe_mark', 'frozen_scarf'].filter((e) => s.evidence.includes(e)).length;
  if (scene < 3) return 'Examine the body. Turn on your flashlight (F) to reveal hidden details.';
  const suspects = ['brandt', 'henrik', 'oskar', 'jonah'].filter((n) => s.talkedTo.includes(n)).length;
  if (suspects < 4) return `Question the townsfolk (${suspects}/4). Try the inn, the clinic and the garage.`;
  if (s.deductions.length < 2) return 'Open the Investigation Board (B) and connect related evidence.';
  const core = ['drugged', 'motive', 'path'].filter((d) => s.deductions.includes(d)).length;
  if (core < 3) return `Establish means, motive and opportunity (${core}/3). Search every corner in the light.`;
  return 'You have the whole picture. Make your accusation from the Board (B).';
}

export const CORE_DEDUCTIONS = DEDUCTIONS.filter((d) => ['drugged', 'motive', 'path'].includes(d.id));
