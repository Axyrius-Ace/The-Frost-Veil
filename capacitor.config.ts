import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.frostveil.game',
  appName: 'Frost Veil',
  webDir: 'dist',
  backgroundColor: '#02040b',
  android: {
    allowMixedContent: true,
  },
};

export default config;
