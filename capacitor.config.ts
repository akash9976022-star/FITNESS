import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fitmaintenance.ai',
  appName: 'FitMaintenance AI',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      clientId: '346245120541-lsk3baiqqbhefr07j0ja2s75bipamq9d.apps.googleusercontent.com',
      androidClientId: '346245120541-lsk3baiqqbhefr07j0ja2s75bipamq9d.apps.googleusercontent.com',
      serverClientId: '346245120541-lsk3baiqqbhefr07j0ja2s75bipamq9d.apps.googleusercontent.com',
      forceCodeForRefreshToken: false,
    }
  }
};

export default config;

