import { Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import { CONFIG } from '../config';

async function hideScrollbars(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `* { scrollbar-width: none !important; } *::-webkit-scrollbar { display: none !important; }`,
  });
}

async function freezeAnimations(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; transition-delay: 0s !important; }`,
  });
}

export async function capture(page: Page, filename: string, device: 'pc' | 'mobile'): Promise<void> {
  await hideScrollbars(page);
  await freezeAnimations(page);
  await page.waitForLoadState('networkidle');

  const dir = path.join(CONFIG.OUTPUT_DIR, device);
  fs.mkdirSync(dir, { recursive: true });

  const outputPath = path.join(dir, `${filename}.png`);
  await page.screenshot({ path: outputPath, fullPage: false });
  console.log(`✅ ${device}/${filename}.png`);
}
