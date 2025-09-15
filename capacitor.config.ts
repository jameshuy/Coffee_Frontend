import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.coffeeandposter.app',
  appName: 'CoffeeApp',
  webDir: 'dist',
  server: {
    url: 'https://coffee-frontend-tikz.onrender.com', // your deployed frontend
    cleartext: true
  }
};

export default config;
