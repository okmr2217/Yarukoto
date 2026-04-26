import type { AuthHandler } from 'shot-kit';

interface Credentials {
  readonly email: string;
  readonly password: string;
}

export function createAuthHandler(credentials: Credentials): AuthHandler {
  return async (page, config) => {
    await page.goto(`${config.baseUrl}/login`);
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', credentials.email);
    await page.fill('input[type="password"]', credentials.password);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), {
      timeout: 15000,
    });
    await page.waitForLoadState('networkidle');
  };
}

const authHandler: AuthHandler = createAuthHandler({
  email: process.env['SHOT_KIT_EMAIL'] ?? '',
  password: process.env['SHOT_KIT_PASSWORD'] ?? '',
});

export default authHandler;
