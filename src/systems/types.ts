export interface Rect { x: number; y: number; w: number; h: number; }
export interface Point { x: number; y: number; }

export type EvidenceKind = 'physical' | 'testimony' | 'document';

export interface Evidence {
  id: string;
  name: string;
  kind: EvidenceKind;
  icon: string;
  description: string;
}

export interface Suspect {
  id: string;
  name: string;
  role: string;
  bio: string;
  witness?: boolean;
}

export interface Effects {
  giveEvidence?: string[];
  setFlags?: string[];
  journal?: string;
}

export interface DialogueChoice {
  text: string;
  next: string | null;
  /** evidence ids, flags or deduction ids that must all be known */
  requires?: string[];
  /** hide the choice once any of these are known */
  hideIf?: string[];
  effects?: Effects;
}

export interface DialogueNode {
  speaker: string;
  text: string;
  choices?: DialogueChoice[];
  next?: string | null;
  effects?: Effects;
}

export interface DialogueTree {
  npc: string;
  name: string;
  start: string;
  nodes: Record<string, DialogueNode>;
}

export interface Deduction {
  id: string;
  a: string;
  b: string;
  title: string;
  text: string;
  implicates?: string;
  clears?: string;
}

export interface Ending {
  id: string;
  title: string;
  subtitle: string;
  tone: 'true' | 'bitter' | 'bad';
  text: string[];
}
