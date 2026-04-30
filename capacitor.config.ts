import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.scm.qc.app',
  appName: 'SCM Garments QC',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
