export interface Evidence {
  id: string;
  name: string;
  short: string;
  description: string;
  location: string;
  hidden: boolean;
}

const list: Evidence[] = [
  {
    id: 'stopped_watch', name: "Mara's Wristwatch", short: 'Stopped at 11:52',
    description: 'Cracked glass, hands frozen at 11:52. Meltwater seeped into the mechanism and froze solid. It stopped when she went cold.',
    location: 'Town square, on the victim', hidden: false,
  },
  {
    id: 'syringe_mark', name: 'Needle Puncture', short: 'A pinprick on her neck',
    description: 'A tiny puncture on the side of Mara\'s neck, ringed by a faint bruise. Invisible except under direct light. That is not a frost blister.',
    location: 'Town square, on the victim', hidden: true,
  },
  {
    id: 'frozen_scarf', name: 'Grey Wool Scarf', short: "Initials 'O.L.'",
    description: 'Hand-knitted, stiff with ice, half buried beside the body. Initials stitched into the hem: O.L.',
    location: 'Town square, beside the victim', hidden: false,
  },
  {
    id: 'small_bootprints', name: 'Star-Tread Prints', short: 'Small prints to the clinic',
    description: 'Small bootprints, about size 37, with a distinctive star-shaped tread. Made after the plow passed. They lead from the square toward the clinic.',
    location: 'Snow between the square and the clinic', hidden: true,
  },
  {
    id: 'torn_letter', name: 'Torn Letter', short: 'Addressed to the magistrate',
    description: "Half a letter in Mara's hand, addressed to the valley magistrate: \"...the three who died last winter did not die of fever. They were given something. I have proof, hidden where only God keeps accounts.\"",
    location: 'Post office, under the sorting desk', hidden: true,
  },
  {
    id: 'sedative_ledger', name: 'Morphenol Register', short: 'Two vials missing',
    description: "The clinic's controlled-drug register. Two vials of Morphenol, a powerful sedative, were signed out last night. The signature line is blank.",
    location: 'Brandt Clinic, drug cabinet', hidden: false,
  },
  {
    id: 'star_boots', name: 'Wet Winter Boots', short: 'Size 37, star tread',
    description: "Women's boots, size 37, tucked behind the clinic curtain. Star-tread soles packed with fresh snow. Still dripping meltwater.",
    location: 'Brandt Clinic, behind the curtain', hidden: true,
  },
  {
    id: 'plow_log', name: 'Plow Route Log', short: 'Square clear at 23:30',
    description: "Jonah's handwritten log. \"Town square, 23:30: cleared, nothing to report.\" His next pass at 00:45 is when he found the body.",
    location: 'Given by Jonah Kell', hidden: false,
  },
  {
    id: 'guest_book', name: 'Inn Guest Book', short: 'Henrik serving until 00:20',
    description: 'Six stranded travelers signed for drinks served by Henrik between 22:00 and 00:20. His handwriting is on every line.',
    location: 'The Last Lantern, the bar', hidden: false,
  },
  {
    id: 'debt_notice', name: 'Debt Notice', short: 'Oskar owed 300 crowns',
    description: 'A promissory note: Oskar Linden owes Mara Linden 300 crowns. Dated October. Creased from being read many times.',
    location: 'The Last Lantern, corner table', hidden: false,
  },
  {
    id: 'confession_page', name: 'Hidden Register Page', short: "Three overdoses, 'I.B.'",
    description: "Tucked behind the hymn board: a page torn from last winter's clinic register. Three fever patients, three doses of Morphenol far beyond any safe amount. Each initialed 'I.B.'",
    location: 'Church, behind the hymn board', hidden: true,
  },
];

export const EVIDENCE: Record<string, Evidence> = Object.fromEntries(list.map((e) => [e.id, e]));
export const EVIDENCE_IDS = list.map((e) => e.id);
