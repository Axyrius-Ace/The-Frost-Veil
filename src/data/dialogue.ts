/**
 * Data-driven branching dialogue.
 * Each NPC has ordered start rules (first matching condition wins) and a graph of nodes.
 * Choices can be gated by evidence, deductions and flags. Effects fire when a node is entered.
 */
export interface Cond {
  ev?: string[];      // must have all evidence
  notEv?: string[];   // must NOT have evidence
  ded?: string[];     // must have all deductions
  flags?: string[];   // all flags set
  not?: string[];     // none of these flags set
}
export interface Effect { flag?: string; evidence?: string; note?: string }
export interface Choice { text: string; next: string; cond?: Cond; effects?: Effect[] }
export interface DNode {
  speaker?: 'npc' | 'narrator' | 'player';
  text: string;
  choices?: Choice[];
  next?: string; // 'END' closes
  effects?: Effect[];
}
export interface DialogueTree { start: { cond?: Cond; node: string }[]; nodes: Record<string, DNode> }

export const DIALOGUES: Record<string, DialogueTree> = {
  halvorsen: {
    start: [{ cond: { not: ['met_sheriff'] }, node: 'intro' }, { node: 'hub' }],
    nodes: {
      intro: { text: "Detective. Didn't think the pass would let anyone through tonight. You came up on the last bus before they closed the road, you know that?", next: 'intro2' },
      intro2: {
        text: "Mara Linden. Postmistress. Jonah found her under the clock at quarter to one, frozen stiff. Doc Brandt says she wandered out drunk and the cold did the rest.",
        next: 'intro3',
        effects: [{ flag: 'met_sheriff' }, { note: 'Met Sheriff Halvorsen at the square. Victim: Mara Linden, postmistress. Found under the town clock by Jonah Kell at 00:45.' }],
      },
      intro3: { text: "Mara never touched a drop in her life. So humor an old man. Look at her properly. Your eyes are younger than mine, and that flashlight beats my lantern.", next: 'hub' },
      hub: {
        text: 'What do you need?',
        choices: [
          { text: 'What do we know about Mara?', next: 'mara' },
          { text: 'Who might have wanted her dead?', next: 'suspects' },
          { text: "Tell me about Doctor Brandt's verdict.", next: 'verdict' },
          { text: "There's a needle mark on her neck.", next: 'needle', cond: { ev: ['syringe_mark'] } },
          { text: "The square was empty at 23:30. Someone brought her here.", next: 'timeline', cond: { ded: ['timeline'] } },
          { text: 'How do I close this case?', next: 'howto' },
          { text: "I'll keep looking.", next: 'END' },
        ],
      },
      mara: { text: "Ran the post office twenty years. Knew everyone's business because she carried it in her satchel. Kind woman. Too curious for a town this small.", next: 'hub', effects: [{ note: "Halvorsen: Mara knew everyone's business. \"Too curious for a town this small.\"" }] },
      suspects: {
        text: "Her brother Oskar's drowning himself at the Last Lantern. Owed her money. Henrik Voss runs the inn, had words with her last week. Doctor Brandt at the clinic signed her off. And Jonah... well. Jonah found her.",
        next: 'hub',
        effects: [{ flag: 'suspects_known' }, { note: 'Persons of interest: Oskar Linden (brother, the inn), Henrik Voss (innkeeper), Dr. Ilse Brandt (clinic), Jonah Kell (plow driver, by the garage).' }],
      },
      verdict: { text: "\"Exposure, aided by alcohol.\" Took her four minutes. She was white as the snow herself, mind you. But it's been a long winter for all of us. Longest since the fever.", next: 'hub' },
      needle: { text: '...A needle. Brandt knelt right where you\'re standing and told me there was nothing. Not one word about a needle.', next: 'hub', effects: [{ flag: 'sheriff_needle' }, { note: 'Halvorsen: Brandt examined the body and never mentioned a needle mark.' }] },
      timeline: { text: "Then she didn't wander. She was carried. In this storm nobody carries a grown woman far. Whoever did it lives close to this square, Detective.", next: 'hub' },
      howto: { text: "Pin what you find to your board and connect what belongs together. When you've got the means, the motive and a path to this square, bring me a name. Wrong names ruin lives, even up here.", next: 'hub' },
    },
  },

  brandt: {
    start: [{ cond: { not: ['met_brandt'] }, node: 'intro' }, { node: 'hub' }],
    nodes: {
      intro: { text: "Detective. Forgive me if I don't stand, I've been awake for thirty hours. If this is about poor Mara... exposure. The cold doesn't forgive mistakes.", next: 'hub', effects: [{ flag: 'met_brandt' }] },
      hub: {
        text: 'Is there something else? I have patients.',
        choices: [
          { text: 'You examined the body?', next: 'exam' },
          { text: 'Where were you last night?', next: 'alibi' },
          { text: 'Mara came to see you last night. At nine.', next: 'visit', cond: { flags: ['mara_saw_doctor'] } },
          { text: "There's a puncture on her neck.", next: 'needle', cond: { ev: ['syringe_mark'] } },
          { text: 'Two vials of Morphenol are missing from your cabinet.', next: 'ledger', cond: { ev: ['sedative_ledger'] } },
          { text: 'Whose boots are behind that curtain?', next: 'boots', cond: { ev: ['star_boots'] } },
          { text: 'Tell me about the three who died last winter.', next: 'winter', cond: { ev: ['torn_letter'] } },
          { text: "I'll let you rest.", next: 'END' },
        ],
      },
      exam: { text: 'Briefly. There was nothing to find. No wounds, no bruising. The cold is a gentle killer, Detective. It leaves no marks.', next: 'hub', effects: [{ note: 'Brandt insists there were "no marks" on the body.' }] },
      alibi: { text: 'Here. Alone, with my case files, until I fell asleep at the desk. Not a thrilling alibi, I\'m afraid.', next: 'hub', effects: [{ flag: 'brandt_alibi' }, { note: 'Brandt: alone at the clinic all night. No witnesses.' }] },
      visit: { text: 'She... yes. A cough. I gave her lozenges and sent her home before ten. I didn\'t think it was worth mentioning.', next: 'hub', effects: [{ flag: 'brandt_lied_visit' }, { note: 'Brandt admits Mara came to the clinic around nine. She hid it until pressed.' }] },
      needle: { text: "A frost blister, surely. Skin splits in that kind of cold. You're not a physician, Detective.", next: 'needle2' },
      needle2: { speaker: 'narrator', text: 'She folds her hands to stop them shaking.', next: 'hub', effects: [{ note: 'Brandt called the needle mark a "frost blister." Her hands were shaking.' }] },
      ledger: { text: 'Inventory errors happen. Jonah helps with my deliveries. Perhaps you should ask him where things go.', next: 'hub', effects: [{ flag: 'brandt_blames_jonah' }, { note: 'Brandt deflects the missing Morphenol onto Jonah.' }] },
      boots: { text: "Those? Old. I haven't worn them in weeks.", next: 'boots2' },
      boots2: { speaker: 'narrator', text: 'Meltwater is still pooling beneath them.', next: 'hub', effects: [{ flag: 'brandt_lied_boots' }, { note: 'Brandt says the boots are weeks old. They are still wet.' }] },
      winter: { text: 'The fever took three people. I did everything... everything I could. You weren\'t here. You didn\'t hear them breathing.', next: 'hub', effects: [{ note: "Brandt turns defensive about last winter's \"fever\" deaths." }] },
    },
  },

  henrik: {
    start: [{ cond: { not: ['met_henrik'] }, node: 'intro' }, { node: 'hub' }],
    nodes: {
      intro: { text: "Bar's closed unless you're paying. ...Ah. The detective. About Mara? I didn't like her. That's not a crime, last I checked.", next: 'hub', effects: [{ flag: 'met_henrik' }] },
      hub: {
        text: 'Well?',
        choices: [
          { text: 'I hear you two argued last week.', next: 'argue' },
          { text: 'Where were you last night?', next: 'alibi' },
          { text: 'Tell me about Oskar.', next: 'oskar' },
          { text: 'See anything strange last night?', next: 'strange' },
          { text: 'Your guest book puts you here until after midnight.', next: 'cleared', cond: { ev: ['guest_book'] } },
          { text: 'Never mind.', next: 'END' },
        ],
      },
      argue: { text: "She was reading my guests' letters before she delivered them. Steamed them open, I'd wager. I told her to keep her nose out of other people's envelopes.", next: 'hub', effects: [{ note: "Henrik: Mara opened other people's letters. She knew secrets." }] },
      alibi: { text: 'Behind this bar. Six travelers stuck by the storm, drinking my aquavit and complaining about it. Ask them. Or check the book, I make everyone sign.', next: 'hub' },
      oskar: { text: 'Drinks on credit and cries into the cup. But he loved her. Gave her his own scarf on Tuesday when her coat tore. Sat right there stitching his initials into it first, the sentimental fool.', next: 'hub', effects: [{ flag: 'henrik_scarf' }, { note: 'Henrik: Oskar gave Mara his scarf on Tuesday.' }] },
      strange: { text: 'Half eleven, I stepped out for air. Saw a lantern moving toward the square. Small figure, hunched, dragging something. Walked like they knew exactly where the ice was.', next: 'hub', effects: [{ flag: 'lantern_seen' }, { note: 'Henrik saw a small figure with a lantern, dragging something toward the square, around 23:30.' }] },
      cleared: { text: "Told you. I'm a bastard, Detective. Not a murderer.", next: 'hub', effects: [{ flag: 'henrik_cleared' }] },
    },
  },

  oskar: {
    start: [{ cond: { not: ['met_oskar'] }, node: 'intro' }, { node: 'hub' }],
    nodes: {
      intro: { text: "She's gone. Mara's gone, and the whole town's already whispering it was me. I can hear them through the floorboards.", next: 'hub', effects: [{ flag: 'met_oskar' }] },
      hub: {
        text: 'What do you want from me?',
        choices: [
          { text: 'When did you last see her?', next: 'last' },
          { text: 'You owed her money.', next: 'debt', cond: { ev: ['debt_notice'] } },
          { text: 'Your scarf was found beside her body.', next: 'scarf', cond: { ev: ['frozen_scarf'] } },
          { text: 'Was Mara afraid of anyone?', next: 'afraid' },
          { text: "I'm sorry for your loss.", next: 'END' },
        ],
      },
      last: { text: "Nine o'clock. She came by for supper and didn't eat. Said she was going to see the doctor. I thought she meant her cough.", next: 'hub', effects: [{ flag: 'mara_saw_doctor' }, { note: 'Oskar: Mara left at nine o\'clock to see Dr. Brandt.' }] },
      debt: { text: 'Three hundred crowns. She tore up the original on Sunday. Said family is family. I kept my copy because... because I wanted to pay her back anyway.', next: 'hub', effects: [{ flag: 'oskar_debt_forgiven' }, { note: 'Oskar says Mara forgave the debt on Sunday.' }] },
      scarf: { text: 'I gave it to her. Tuesday. Her coat was torn and she\'d have frozen on her rounds. She... she was still wearing it?', next: 'scarf2' },
      scarf2: { speaker: 'narrator', text: 'His voice breaks. He stares into the fire for a long time.', next: 'hub', effects: [{ flag: 'oskar_scarf_explained' }] },
      afraid: { text: 'She\'d been jumpy for weeks. Carried letters around like they burned her hands. Kept saying the church was the only place a secret could stay safe.', next: 'hub', effects: [{ flag: 'hint_church' }, { note: 'Oskar: Mara said the church was "the only place a secret could stay safe."' }] },
    },
  },

  jonah: {
    start: [{ cond: { not: ['met_jonah'] }, node: 'intro' }, { node: 'hub' }],
    nodes: {
      intro: { text: "I didn't do anything! I just... she was sitting there, and my headlights hit her face, and her eyes were open, and...", next: 'hub', effects: [{ flag: 'met_jonah' }] },
      hub: {
        text: 'Am I in trouble?',
        choices: [
          { text: 'Breathe. Tell me what you saw.', next: 'saw' },
          { text: 'When did you plow the square?', next: 'route' },
          { text: 'Can I see your route log?', next: 'log', cond: { flags: ['jonah_route'], notEv: ['plow_log'] } },
          { text: 'The doctor says you handle her deliveries.', next: 'clinic', cond: { flags: ['brandt_blames_jonah'] } },
          { text: "You're not in trouble. Stay warm.", next: 'END' },
        ],
      },
      saw: { text: 'Quarter to one. She was propped against the clock like someone sat her there. Snow on her eyelashes. Nobody just sits down like that.', next: 'hub', effects: [{ note: 'Jonah: Mara was "propped against the clock like someone sat her there."' }] },
      route: { text: 'Every two hours, all night. I did the square at half eleven. Clean. Nobody there, I swear on my mother. It\'s all in the log.', next: 'hub', effects: [{ flag: 'jonah_route' }] },
      log: { text: 'Here. The council makes me write everything down. Times, streets, all of it.', next: 'hub', effects: [{ evidence: 'plow_log' }] },
      clinic: { text: 'Sometimes. Boxes from the valley. But I\'ve never touched the locked cabinet. Only the doctor has that key. She wears it round her neck.', next: 'hub', effects: [{ flag: 'jonah_key' }, { note: 'Jonah: only Dr. Brandt has the key to the drug cabinet.' }] },
    },
  },
};
