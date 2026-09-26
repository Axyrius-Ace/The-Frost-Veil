export type DeductionCategory = 'means' | 'motive' | 'opportunity' | 'timeline' | 'alibi' | 'theory';

export interface Deduction {
  id: string;
  a: string;
  b: string;
  title: string;
  text: string;
  category: DeductionCategory;
  /** If any of these flags are set, the deduction is shown as contradicted. */
  contradictedBy?: string[];
}

export const DEDUCTIONS: Deduction[] = [
  {
    id: 'drugged', a: 'syringe_mark', b: 'sedative_ledger', category: 'means',
    title: 'She was sedated',
    text: 'The needle mark and the missing Morphenol: Mara was injected with a sedative taken from the clinic, then left to freeze.',
  },
  {
    id: 'motive', a: 'torn_letter', b: 'confession_page', category: 'motive',
    title: 'The fever that wasn\'t',
    text: 'Mara found proof that "I.B." overdosed three patients last winter, and she was about to send it to the valley magistrate.',
  },
  {
    id: 'path', a: 'small_bootprints', b: 'star_boots', category: 'opportunity',
    title: 'The trail ends at the clinic',
    text: 'The small star-tread prints leading from the body match the wet boots hidden behind the clinic curtain.',
  },
  {
    id: 'timeline', a: 'plow_log', b: 'stopped_watch', category: 'timeline',
    title: 'Placed after the plow',
    text: 'The square was empty at 23:30 and her watch froze at 11:52. She was carried there, already dying, in those twenty-two minutes.',
  },
  {
    id: 'henrik_clear', a: 'guest_book', b: 'stopped_watch', category: 'alibi',
    title: 'Henrik is accounted for',
    text: 'At 11:52 Henrik was pouring drinks for six witnesses. Whatever else he is, he is not the killer.',
  },
  {
    id: 'oskar_theory', a: 'frozen_scarf', b: 'debt_notice', category: 'theory',
    title: 'The brother\'s debt',
    text: 'Oskar owed his sister money, and his scarf was found at the scene. Motive and presence... on paper.',
    contradictedBy: ['oskar_scarf_explained', 'henrik_scarf', 'oskar_debt_forgiven'],
  },
];

export function findDeduction(a: string, b: string): Deduction | undefined {
  return DEDUCTIONS.find((d) => (d.a === a && d.b === b) || (d.a === b && d.b === a));
}
