import { chromium } from 'playwright';
import { CONFIG } from './config';
import { login } from './utils/auth';
import { runPcScenarios, runMobileScenarios, runLoginScenarios } from './scenarios/index';

async function main() {
  const browser = await chromium.launch({ headless: true });

  // PC context (authenticated)
  const pcContext = await browser.newContext({
    viewport: CONFIG.VIEWPORTS.pc,
    deviceScaleFactor: CONFIG.DEVICE_SCALE_FACTOR,
  });
  const pcPage = await pcContext.newPage();
  await login(pcPage);
  await runPcScenarios(pcPage);
  await pcContext.close();

  // Mobile context (authenticated)
  const mobileContext = await browser.newContext({
    viewport: CONFIG.VIEWPORTS.mobile,
    deviceScaleFactor: CONFIG.DEVICE_SCALE_FACTOR,
  });
  const mobilePage = await mobileContext.newPage();
  await login(mobilePage);
  await runMobileScenarios(mobilePage);
  await mobileContext.close();

  // Unauthenticated context for login/forgot-password
  const unauthContext = await browser.newContext({
    viewport: CONFIG.VIEWPORTS.pc,
    deviceScaleFactor: CONFIG.DEVICE_SCALE_FACTOR,
  });
  const unauthPage = await unauthContext.newPage();
  await runLoginScenarios(unauthPage);
  await unauthContext.close();

  await browser.close();
  console.log('Done! Screenshots saved to', CONFIG.OUTPUT_DIR);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
