import { Page } from 'playwright';
import { CONFIG } from '../config';

export async function login(page: Page): Promise<void> {
  await page.goto(`${CONFIG.BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', CONFIG.AUTH.email);
  await page.fill('input[type="password"]', CONFIG.AUTH.password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
  await page.waitForLoadState('networkidle');
}
