export interface CharacterNote { flag?: string; evidence?: string; deduction?: string; text: string }
export interface Character {
  id: string;
  name: string;
  role: string;
  suspect: boolean;
  bio: string;
  notes: CharacterNote[];
}

export const CHARACTERS: Record<string, Character> = {
  halvorsen: {
    id: 'halvorsen', name: 'Sheriff Aksel Halvorsen', role: 'Town sheriff', suspect: false,
    bio: 'Sixty-one, bad knees, thirty winters wearing the badge. The only person in Hollowpine who asked for outside help.',
    notes: [
      { flag: 'sheriff_needle', text: 'Brandt examined the body and never mentioned the needle mark.' },
    ],
  },
  brandt: {
    id: 'brandt', name: 'Dr. Ilse Brandt', role: 'Town physician', suspect: true,
    bio: "Hollowpine's only doctor for fifteen years. Pronounced Mara's death 'exposure' in four minutes.",
    notes: [
      { flag: 'brandt_alibi', text: 'Claims she was alone at the clinic all night. No witnesses.' },
      { flag: 'brandt_lied_visit', text: 'Hid that Mara visited her at nine o\'clock.' },
      { flag: 'brandt_blames_jonah', text: 'Deflected the missing Morphenol onto Jonah.' },
      { flag: 'jonah_key', text: 'Wears the only key to the drug cabinet around her neck.' },
      { flag: 'brandt_lied_boots', text: 'Said the boots were old. They were still dripping.' },
    ],
  },
  henrik: {
    id: 'henrik', name: 'Henrik Voss', role: 'Innkeeper, The Last Lantern', suspect: true,
    bio: 'Blunt, unfriendly, and loudly unbothered. Argued with Mara a week before her death.',
    notes: [
      { flag: 'met_henrik', text: "Admits he didn't like Mara." },
      { flag: 'lantern_seen', text: 'Saw a small figure with a lantern heading for the square around 23:30.' },
      { deduction: 'henrik_clear', text: 'ALIBI CONFIRMED: serving six witnesses at the time of death.' },
    ],
  },
  oskar: {
    id: 'oskar', name: 'Oskar Linden', role: "The victim's brother", suspect: true,
    bio: 'Unemployed since the mine closed. Drinks on credit. The town has already decided it was him.',
    notes: [
      { flag: 'mara_saw_doctor', text: 'Says Mara left his room at nine to see Dr. Brandt.' },
      { flag: 'oskar_debt_forgiven', text: 'Says Mara forgave his 300-crown debt on Sunday.' },
      { flag: 'oskar_scarf_explained', text: 'Gave Mara his scarf on Tuesday when her coat tore.' },
      { flag: 'henrik_scarf', text: 'Henrik independently confirms the scarf was a gift.' },
    ],
  },
  jonah: {
    id: 'jonah', name: 'Jonah Kell', role: 'Snowplow driver', suspect: true,
    bio: 'Nineteen. Drives the council plow all night. Found the body at 00:45 and has not stopped shaking since.',
    notes: [
      { flag: 'jonah_route', text: 'Cleared the square at 23:30. Nobody was there.' },
      { evidence: 'plow_log', text: 'Handed over his route log without hesitation.' },
    ],
  },
};

export const SUSPECT_IDS = ['brandt', 'henrik', 'oskar', 'jonah'];
