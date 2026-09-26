import type { DialogueTree } from '../systems/types';

export const NPC_NAMES: Record<string, string> = {
  viktor: 'Viktor Hale',
  ilse: 'Dr. Ilse Brandt',
  tomas: 'Tomas Reyn',
  oren: 'Father Oren',
};

const V = 'Viktor Hale';
const I = 'Dr. Ilse Brandt';
const T = 'Tomas Reyn';
const O = 'Father Oren';

export const DIALOGUES: Record<string, DialogueTree> = {
  viktor: {
    npc: 'viktor', name: V, start: 'start',
    nodes: {
      start: {
        speaker: V,
        text: "Detective. Shut the door, you're letting the mountain in. If this is about Marta, I've got nothing to say the snow won't say better.",
        choices: [
          { text: 'Where were you last night?', next: 'alibi' },
          { text: 'Tell me about Marta.', next: 'marta' },
          { text: 'Your ledger says you owed her 400 crowns.', next: 'ledger', requires: ['e_ledger'] },
          { text: 'Recognize this blue scarf?', next: 'scarf', requires: ['e_scarf'] },
          { text: "That's all for now.", next: null },
        ],
      },
      alibi: {
        speaker: V,
        text: "Behind this bar till past midnight. Ask anyone. Half the town was in here hiding from the storm. The bell stopped while I was pouring for old Gerrit. Everybody went quiet. Bells don't stop, not here.",
        effects: { giveEvidence: ['t_viktor_alibi'], journal: 'Viktor claims half the town saw him at the bar when the bell stopped.' },
        next: 'start',
      },
      marta: {
        speaker: V,
        text: "She ran the post. Knew everyone's business because she carried it in a leather bag. People said she read the letters. I said people should write less.",
        next: 'start',
      },
      ledger: {
        speaker: V,
        text: "...Yes. I owed her. She never pressed. Last week she laughed and said she had bigger fish frozen in the ice than me. Her words. Bigger fish.",
        effects: { setFlags: ['bigger_fish'], journal: "Marta told Viktor she had 'bigger fish in the ice.'" },
        next: 'start',
      },
      scarf: {
        speaker: V,
        text: "Blue wool? That's the doctor's. She wore it in here Tuesday. Smell it: carbolic. Everything that woman touches smells like her clinic.",
        effects: { setFlags: ['scarf_identified'], journal: "Viktor identifies the blue scarf as Dr. Brandt's." },
        next: 'start',
      },
    },
  },

  ilse: {
    npc: 'ilse', name: I, start: 'start',
    nodes: {
      start: {
        speaker: I,
        text: "Detective. I've already examined the body for the constable. Hypothermia. It happens every winter up here. The mountain is not sentimental.",
        choices: [
          { text: 'Where were you last night?', next: 'alibi' },
          { text: 'Did you know Marta well?', next: 'marta' },
          { text: 'Father Oren saw your lantern crossing the square.', next: 'lantern', requires: ['t_oren_lantern', 't_ilse_claim'] },
          { text: 'I found an empty Veronal vial under your cabinet.', next: 'vial', requires: ['e_vial'] },
          { text: 'There was a needle mark on her neck.', next: 'needle', requires: ['e_needle'] },
          { text: 'Marta was going to report your death certificates.', next: 'letter', requires: ['e_letter'] },
          { text: 'Goodbye, Doctor.', next: null },
        ],
      },
      alibi: {
        speaker: I,
        text: "Here. All night. Nobody goes out in this, Detective, not unless they want to end up like her. I didn't leave the clinic once.",
        effects: { giveEvidence: ['t_ilse_claim'], journal: 'Dr. Brandt insists she never left the clinic.' },
        next: 'start',
      },
      marta: {
        speaker: I,
        text: 'She brought my post twice a week. She was... thorough. She asked a great many questions for a woman who delivered envelopes.',
        next: 'start',
      },
      lantern: {
        speaker: I,
        text: "Oren is an old man staring into a blizzard from a bell tower. He saw a light. It could have been anyone's light.",
        effects: { setFlags: ['ilse_evasive'] },
        next: 'start',
      },
      vial: {
        speaker: I,
        text: 'Half this town takes Veronal to sleep through these nights. That vial could be months old.',
        next: 'vial2',
      },
      vial2: {
        speaker: 'Narration',
        text: 'Her hands stop moving across the paper. Only for a moment. The glass you found was spotless.',
        effects: { setFlags: ['ilse_nervous'] },
        next: 'start',
      },
      needle: {
        speaker: I,
        text: "Frostbite blisters. Skin splits in this cold. You are a detective, not a physician. I'd leave the medicine to me.",
        next: 'start',
      },
      letter: {
        speaker: I,
        text: "Where did you get that? ...Those people were dying anyway. The mountain takes whoever it wants. I signed what was true.",
        next: 'letter2',
      },
      letter2: {
        speaker: I,
        text: "I think you should go now, Detective. Before the lamps go out.",
        effects: { setFlags: ['ilse_cracked'], journal: "Confronted with the letter, Dr. Brandt didn't deny the certificates." },
        next: null,
      },
    },
  },

  tomas: {
    npc: 'tomas', name: T, start: 'start',
    nodes: {
      start: {
        speaker: T,
        text: "What. I've got forty kilometres of road that keep disappearing. Make it quick.",
        choices: [
          { text: "You're Marta's brother.", next: 'brother' },
          { text: 'Were you in the square last night?', next: 'square' },
          { text: 'Your boot prints lead straight to the fountain.', next: 'prints', requires: ['e_prints'] },
          { text: 'Is this what she found?', next: 'letter', requires: ['e_letter', 't_tomas_argue'] },
          { text: 'Get back to your road.', next: null },
        ],
      },
      brother: {
        speaker: T,
        text: "Was. We hadn't spoken properly in six years. She left, I stayed. Then last night, out of nowhere, she wanted to talk.",
        next: 'start',
      },
      square: {
        speaker: T,
        text: "Fine. Yes. She called me out there. Said she'd found something that would bring the whole town down, said she needed me. We shouted. I walked off around eleven. She was alive. Furious, but alive.",
        effects: { giveEvidence: ['t_tomas_argue'], journal: "Tomas admits meeting Marta at the fountain around 11. She'd found something big." },
        next: 'start',
      },
      prints: {
        speaker: T,
        text: 'Course they do. I told you I was there. Look how the snow filled them. I was back under this plow before the bell went quiet.',
        next: 'start',
      },
      letter: {
        speaker: T,
        text: "...Certificates. She kept saying that word. Six people who didn't have to die, she said. I thought she'd lost her mind up here. God help me, I told her so.",
        effects: { setFlags: ['tomas_grief'] },
        next: 'start',
      },
    },
  },

  oren: {
    npc: 'oren', name: O, start: 'start',
    nodes: {
      start: {
        speaker: O,
        text: 'Forty winters I have rung that bell, Detective. Last night the rope froze in my hands at twenty to midnight. The Lord has a sense of timing I do not care for.',
        choices: [
          { text: 'Did you see anything from the tower?', next: 'lantern' },
          { text: 'Tell me about Marta.', next: 'marta' },
          { text: 'Who would want her dead?', next: 'enemies' },
          { text: 'Bless you, Father.', next: null },
        ],
      },
      lantern: {
        speaker: O,
        text: "A lantern. Crossing the square from the fountain toward the clinic, a few minutes after the bell failed. Small steps. Careful steps. I assumed it was the doctor on a call. She is the only one who goes out on nights like that.",
        effects: { giveEvidence: ['t_oren_lantern'], journal: "Father Oren saw a lantern move from the fountain to the clinic just after 11:40." },
        next: 'start',
      },
      marta: {
        speaker: O,
        text: "She lit a candle here every Sunday for her mother. Last week she lit six. When I asked, she said, 'For the ones nobody lit one for.'",
        effects: { setFlags: ['six_candles_told'] },
        next: 'start',
      },
      enemies: {
        speaker: O,
        text: 'Everyone carries something up here. Viktor owes half the valley. Tomas never forgave his sister for leaving. And the doctor... the doctor signs more death certificates than any physician in a town this size ought to.',
        effects: { journal: 'Father Oren: the doctor signs an unusual number of death certificates.' },
        next: 'start',
      },
    },
  },
};
