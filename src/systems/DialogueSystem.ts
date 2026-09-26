import { DIALOGUES } from '../data/dialogues';
import { audio } from './AudioSystem';
import { store } from './GameStore';
import type { DialogueChoice, Effects } from './types';

export function applyEffects(e?: Effects) {
  if (!e) return;
  e.giveEvidence?.forEach(id => { if (store.addEvidence(id)) audio.discover(); });
  e.setFlags?.forEach(f => store.addFlag(f));
  if (e.journal) store.log(e.journal);
}

export function startDialogue(npc: string) {
  const tree = DIALOGUES[npc];
  if (!tree) return;
  store.addFlag(`met_${npc}`);
  gotoNode(npc, tree.start);
}

export function gotoNode(npc: string, nodeId: string | null | undefined) {
  if (!nodeId) { endDialogue(); return; }
  const node = DIALOGUES[npc]?.nodes[nodeId];
  if (!node) { endDialogue(); return; }
  store.set({ ui: 'dialogue', dialogue: { npc, node: nodeId } });
  applyEffects(node.effects);
  store.addFlag(`seen:${npc}:${nodeId}`);
}

export function endDialogue() {
  store.lock();
  store.set({ ui: null, dialogue: null });
  store.autosave();
}

export function visibleChoices(npc: string, nodeId: string): DialogueChoice[] {
  const node = DIALOGUES[npc]?.nodes[nodeId];
  if (!node?.choices) return [];
  return node.choices.filter(c => (!c.requires || c.requires.every(r => store.has(r))) && !(c.hideIf?.some(h => store.has(h))));
}

export function choose(npc: string, c: DialogueChoice) {
  audio.click();
  applyEffects(c.effects);
  gotoNode(npc, c.next);
}

export function isSeen(npc: string, nodeId: string | null) {
  return !!nodeId && store.has(`seen:${npc}:${nodeId}`);
}
