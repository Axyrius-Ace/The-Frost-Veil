export type HairStyle = 'short' | 'bun' | 'messy' | 'bald' | 'long';
export type Hat = 'fedora' | 'beanie' | 'campaign' | null;
export interface CharPal {
  coat: string; coatDark?: string; skin: string; hair: string; pants: string; boots: string;
  scarf?: string; hat: Hat; hatColor?: string; hairStyle: HairStyle; beard?: string; glasses?: boolean; badge?: boolean; eye?: string;
}

/** Master character palettes. Swap these to re-skin the cast. */
export const PALETTES: Record<string, CharPal> = {
  detective: { coat: '#7a5c3e', skin: '#e2b596', hair: '#2b1d14', pants: '#23262e', boots: '#121216', scarf: '#9a2f34', hat: 'fedora', hatColor: '#2b2622', hairStyle: 'short', eye: '#3a5a7a' },
  halvorsen: { coat: '#3f4c3a', skin: '#d9a888', hair: '#c9c4bb', pants: '#2a2c30', boots: '#18161a', hat: 'campaign', hatColor: '#6b5638', hairStyle: 'short', beard: '#cfcac2', badge: true, eye: '#4a5a4a' },
  brandt: { coat: '#d8d8d2', coatDark: '#a9aab0', skin: '#ecd0bd', hair: '#a8a092', pants: '#3a3c44', boots: '#241a16', scarf: '#4b3a5a', hat: null, hairStyle: 'bun', glasses: true, eye: '#5b6a7a' },
  henrik: { coat: '#5a3a30', skin: '#d49a7c', hair: '#5a3a22', pants: '#2c2622', boots: '#161214', hat: null, hairStyle: 'bald', beard: '#6b4428', eye: '#3a2a1a' },
  oskar: { coat: '#394a68', skin: '#e6bfa4', hair: '#c8964e', pants: '#2a2e38', boots: '#18181c', hat: null, hairStyle: 'messy', eye: '#4a6a8a' },
  jonah: { coat: '#d8a81c', coatDark: '#a07a10', skin: '#e8c0a0', hair: '#3a2a1a', pants: '#2c3440', boots: '#141416', hat: 'beanie', hatColor: '#b03030', hairStyle: 'short', eye: '#5a4a2a' },
  mara: { coat: '#5b6f8a', skin: '#c8d4e0', hair: '#7a3b22', pants: '#2e3440', boots: '#1a1a1e', scarf: '#8a8f99', hat: null, hairStyle: 'long', eye: '#2a3a4a' },
};
