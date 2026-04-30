import type { ShotKitProjectConfig } from 'shot-kit';

const config: ShotKitProjectConfig = {
  projectName: 'yarukoto',
  baseUrl: process.env['SHOT_KIT_BASE_URL'] ?? 'http://localhost:3000',
  launchOptions: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],              
  },
};

export default config;
