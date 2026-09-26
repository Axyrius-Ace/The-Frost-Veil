export interface Ending {
  id: string;
  title: string;
  subtitle: string;
  tone: 'true' | 'bitter' | 'wrong' | 'neutral';
  paragraphs: string[];
}

export const ENDINGS: Record<string, Ending> = {
  true_thaw: {
    id: 'true_thaw', title: 'The Thaw', subtitle: 'True Ending', tone: 'true',
    paragraphs: [
      'You lay it out on the clinic desk: the needle mark, the missing Morphenol, the boots still weeping meltwater onto the floorboards, and a page of last winter\'s register initialed I.B.',
      'Doctor Ilse Brandt listens without interrupting, the way she must have listened to three dying patients. "They were suffering," she says at last. "The fever would have taken them. I only made it quiet." Then, softer: "Mara wanted to make it loud."',
      'Halvorsen lifts the cabinet key from around her neck. Outside, for the first time in eleven days, the wind drops.',
      'By morning the snow has stopped. The road opens at noon. You ride down the mountain in Jonah\'s plow, and behind you the church bell rings for Mara Linden, clear across the valley.',
    ],
  },
  thin_ice: {
    id: 'thin_ice', title: 'Thin Ice', subtitle: 'Bitter Ending', tone: 'bitter',
    paragraphs: [
      'You name her. Doctor Brandt laughs, tired and almost kind. "Detective, you have a hunch and a snowstorm."',
      'She is right. With half the picture, the valley magistrate releases her in the spring, citing insufficient evidence. The town apologizes to her with a cake.',
      'Three weeks later a traveler at the Last Lantern falls asleep in a snowdrift and never wakes up. The certificate reads "exposure," in a neat, familiar hand.',
    ],
  },
  wrong_oskar: {
    id: 'wrong_oskar', title: 'Cold Blood', subtitle: 'Wrong Accusation', tone: 'wrong',
    paragraphs: [
      'The scarf, the debt, the drinking. It is the story Hollowpine already wanted, and Oskar is too broken to argue with it.',
      'In the valley jail he stops eating. Doctor Brandt is called to examine him, and she is very gentle.',
      'In April the snow melts off the church roof and a torn letter to the magistrate is finally found. By then it is addressed to no one.',
    ],
  },
  wrong_henrik: {
    id: 'wrong_henrik', title: 'Bitter Draught', subtitle: 'Wrong Accusation', tone: 'wrong',
    paragraphs: [
      'Henrik doesn\'t even stand up. "Six people watched me pour aquavit all night, you fool."',
      'Six people say so under oath. The case collapses in a week, and so does your reputation.',
      'A bottle arrives at your valley office with a note: "For the cold. - I.B." You never open it. You never quite know why.',
    ],
  },
  wrong_jonah: {
    id: 'wrong_jonah', title: 'Snowblind', subtitle: 'Wrong Accusation', tone: 'wrong',
    paragraphs: [
      'He is nineteen. He cries the whole way down the mountain, and keeps saying he only turned on his headlights.',
      'The town is relieved to have an answer that isn\'t one of their own. Doctor Brandt sits with his mother at the trial and holds her hand.',
      'The plow sits unused all winter. The roads stay buried. Nobody leaves Hollowpine for a long, long time.',
    ],
  },
  whiteout: {
    id: 'whiteout', title: 'Whiteout', subtitle: 'Unsolved', tone: 'neutral',
    paragraphs: [
      'You tell Halvorsen you\'ll send someone up from the valley. You both know no one will come.',
      'The chained bus crawls down the switchbacks. Behind you, Hollowpine dissolves into white, one lamp at a time.',
      'Mara Linden is filed under "exposure." The snow keeps falling. It always will.',
    ],
  },
};

export const ENDING_IDS = Object.keys(ENDINGS);
