import type { Deduction, Ending, Evidence, Suspect } from '../systems/types';

export const CASE_TITLE = 'The Postmistress of Hollowmere';

export const INTRO_TEXT = `HOLLOWMERE. 11:58 PM.

The pass closed three days ago and the phone lines went down with it. You came up the mountain to look into a complaint about missing letters. The road forgot you were here.

Tonight the postmistress, Marta Kell, was found frozen beside the fountain in the square. The doctor says hypothermia. The constable says accident and has gone home to bed.

The church bell stopped ringing at twenty to midnight. It hasn't rung since.

Your flashlight is half charged. The snow is not stopping.

Find out what happened to Marta.`;

export const EVIDENCE: Record<string, Evidence> = {
  e_body: {
    id: 'e_body', name: "Marta's Body", kind: 'physical', icon: '✝',
    description: "Marta Kell, 54, postmistress. Frozen at the fountain's edge, eyes open, frost in her lashes. No sign of a struggle. Her coat is buttoned one hole off, as if someone else dressed her in a hurry.",
  },
  e_needle: {
    id: 'e_needle', name: 'Puncture Mark', kind: 'physical', icon: '•',
    description: "Only the flashlight's hard white beam shows it: a tiny bruised puncture below her left ear. Lamplight would never catch it. Someone put a needle in her neck.",
  },
  e_scarf: {
    id: 'e_scarf', name: 'Blue Wool Scarf', kind: 'physical', icon: '≈',
    description: "Snagged on the fountain's iron rim. Good wool, hand-knitted. It smells sharply of carbolic, the antiseptic used in sickrooms. It isn't Marta's. Hers is still around her neck.",
  },
  e_prints: {
    id: 'e_prints', name: 'Heavy Boot Prints', kind: 'physical', icon: '⁂',
    description: 'Deep work-boot treads, size 46, running from Reyn\'s Garage to the square and back again. Snow has half filled them. At tonight\'s rate of fall they were made well before midnight.',
  },
  e_ledger: {
    id: 'e_ledger', name: 'Inn Debt Ledger', kind: 'document', icon: '₵',
    description: "Viktor Hale's ledger. One line in red ink: 'M. Kell, 400 crowns, owed since March.' Beside it, in Marta's neat hand: 'No hurry, V.'",
  },
  e_letter: {
    id: 'e_letter', name: 'Burnt Letter', kind: 'document', icon: '✉',
    description: "Pulled from the post office stove. Mostly ash. What survives reads: '...six certificates signed without examination... the Hessel boy, the widow Arn... I will take this to the magistrate the day the pass opens. M.K.'",
  },
  e_vial: {
    id: 'e_vial', name: 'Empty Veronal Vial', kind: 'physical', icon: '⚗',
    description: "Rolled under the clinic's medicine cabinet, out of sight. Veronal: a heavy barbiturate sedative. Empty. The glass is clean and dust free. It hasn't been down there long.",
  },
  e_bell_log: {
    id: 'e_bell_log', name: 'Bell Tower Log', kind: 'document', icon: '♫',
    description: "Father Oren's log: every hour rung, for forty years. Last night's entry stops mid-line: '11:40. Rope frozen. Could not ring.' The ink is smeared, as if written with a shaking hand.",
  },
  t_viktor_alibi: {
    id: 't_viktor_alibi', name: "Viktor's Alibi", kind: 'testimony', icon: '❝',
    description: 'Viktor was behind his bar until past midnight with half the town drinking in front of him. Everyone noticed when the bells stopped.',
  },
  t_ilse_claim: {
    id: 't_ilse_claim', name: "Dr. Brandt's Statement", kind: 'testimony', icon: '❝',
    description: '"I didn\'t leave the clinic once. Nobody goes out in this." Dr. Ilse Brandt.',
  },
  t_tomas_argue: {
    id: 't_tomas_argue', name: "Tomas's Account", kind: 'testimony', icon: '❝',
    description: "Tomas met his sister at the fountain around eleven. She said she'd found something that would 'bring the whole town down.' They argued. He swears he left her alive.",
  },
  t_oren_lantern: {
    id: 't_oren_lantern', name: 'The Lantern in the Snow', kind: 'testimony', icon: '❝',
    description: "From the bell tower Father Oren saw a lantern crossing from the fountain toward the clinic, minutes after 11:40. 'Small, careful steps.'",
  },
};

export const EVIDENCE_ORDER = Object.keys(EVIDENCE);

export const SUSPECTS: Suspect[] = [
  { id: 'viktor', name: 'Viktor Hale', role: 'Innkeeper, The Crooked Lantern', bio: 'Broad, tired, generous with drinks and credit. Owes money to half the valley, including the victim.' },
  { id: 'ilse', name: 'Dr. Ilse Brandt', role: 'Town physician', bio: "Hollowmere's only doctor for eleven years. Precise, cool, respected. She signed the preliminary report: hypothermia." },
  { id: 'tomas', name: 'Tomas Reyn', role: "Snowplow driver, the victim's brother", bio: 'Estranged from Marta for six years. Works nights keeping the pass road open. Quick temper, big boots.' },
  { id: 'oren', name: 'Father Oren', role: "Priest of St. Aldric's", bio: 'Has rung the church bell every hour for forty winters. Last night, for the first time, he could not.', witness: true },
];

export const DEDUCTIONS: Deduction[] = [
  { id: 'd_time', a: 'e_body', b: 'e_bell_log', title: 'The Hour of Death',
    text: 'The bell rope froze at 11:40, and the frost pattern on Marta says she stopped moving at about the same time. Whatever happened, happened then.' },
  { id: 'd_sedated', a: 'e_needle', b: 'e_vial', implicates: 'ilse', title: 'Put to Sleep',
    text: 'A needle mark and an empty vial of Veronal. Marta did not wander into the cold. She was sedated, then left in the snow to freeze. A killing dressed up as an accident.' },
  { id: 'd_lie', a: 't_ilse_claim', b: 't_oren_lantern', implicates: 'ilse', title: 'The Doctor Went Out',
    text: 'Dr. Brandt swears she never left the clinic. Father Oren watched a lantern walk from the fountain to her door minutes after 11:40. Her alibi is a lie.' },
  { id: 'd_motive', a: 'e_letter', b: 't_tomas_argue', implicates: 'ilse', title: 'Six Certificates',
    text: "The thing Marta found, the thing that would 'bring the whole town down': six death certificates signed without examination. She was going to the magistrate. Only one person signs certificates in Hollowmere." },
  { id: 'd_scarf', a: 'e_scarf', b: 't_ilse_claim', implicates: 'ilse', title: 'Carbolic and Wool',
    text: 'A scarf reeking of sickroom antiseptic, snagged at the scene. Someone who "never left the clinic" stood at that fountain.' },
  { id: 'd_tomas', a: 'e_prints', b: 'e_bell_log', clears: 'tomas', title: 'Tracks Before the Silence',
    text: "Tomas's boot prints were half filled with snow long before 11:40. He came, he argued, and he was gone before the bell failed." },
  { id: 'd_viktor', a: 'e_ledger', b: 't_viktor_alibi', clears: 'viktor', title: 'Debt Is Not Murder',
    text: 'Viktor owed Marta money and she never pressed him. Half the town watched him pour drinks while the bells went quiet. Motive, yes. Opportunity, no.' },
];

export const CORE_DEDUCTIONS = ['d_sedated', 'd_lie', 'd_motive'];

export const ENDINGS: Record<string, Ending> = {
  veil_lifts: {
    id: 'veil_lifts', title: 'The Veil Lifts', subtitle: 'True Ending', tone: 'true',
    text: [
      'You lay it out in the clinic at dawn: the Veronal, the needle mark, the carbolic scarf, the lantern Father Oren watched cross the square.',
      'Dr. Ilse Brandt listens without interrupting. When you set the burnt letter on her desk, she finally puts down her pen.',
      '"Six people," she says. "Old. Sick. Snowed in with no road down. I signed what the mountain would have signed anyway. Marta wanted names, families, a trial." She looks at the window. "I only wanted her to sleep."',
      'The storm breaks on the third day. The pass opens. The bell of St. Aldric\'s rings again, and seven candles burn in the church: one for each name, and one for Marta.',
    ],
  },
  thin_ice: {
    id: 'thin_ice', title: 'Thin Ice', subtitle: 'Ending: Unproven', tone: 'bitter',
    text: [
      'You arrest Dr. Brandt. You are right, and you know it.',
      'But the case you carry down the mountain has holes, and the snow has filled them. Her lawyer calls it a frozen woman and a detective\'s hunch.',
      'She is acquitted in the spring and reopens the clinic within the month.',
      'You hear from Hollowmere only once more: an envelope with no return address. Inside, a single thread of blue wool.',
    ],
  },
  hunch: {
    id: 'hunch', title: 'Snowblind', subtitle: 'Ending: No Case', tone: 'bad',
    text: [
      'You point at the doctor because something in her eyes is colder than the night.',
      'It is not enough. Not nearly. The constable laughs, then stops laughing when she files a complaint.',
      'You leave Hollowmere when the pass opens, and the town closes behind you like a drift over a footprint.',
    ],
  },
  wrong_door: {
    id: 'wrong_door', title: 'The Wrong Door', subtitle: 'Ending: Wrong Suspect', tone: 'bad',
    text: [
      'Viktor Hale goes quietly. Four hundred crowns is a motive a jury can understand.',
      'It falls apart in a week. Half the town was drinking at his bar when the bell stopped, and every one of them says so.',
      'By then the snow has taken whatever was left in the square. Somewhere on the mountain, a doctor signs another certificate.',
    ],
  },
  frozen_blood: {
    id: 'frozen_blood', title: 'Frozen Blood', subtitle: 'Ending: Wrong Suspect', tone: 'bad',
    text: [
      'The boot prints convict Tomas Reyn. The brother who fought with her. The brother who was there.',
      'He does not fight the sentence. He just keeps saying she called him, that for once in six years she called him.',
      'The snow filled his tracks long before the bell went silent. You simply never checked.',
    ],
  },
  white_silence: {
    id: 'white_silence', title: 'White Silence', subtitle: 'Ending: Case Closed', tone: 'bad',
    text: [
      'You write "hypothermia" in your report, the same word the doctor used.',
      'Everyone in Hollowmere thanks you. Everyone is relieved. That should have told you something.',
      'The veil stays down. It always does, up here.',
    ],
  },
};
