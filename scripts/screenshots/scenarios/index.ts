import { Page } from 'playwright';
import { capture } from '../utils/capture';
import { CONFIG } from '../config';

const BASE_URL = CONFIG.BASE_URL;

export async function runPcScenarios(page: Page): Promise<void> {
  // home-pc
  try {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    await capture(page, 'home-pc', 'pc');
  } catch (e) {
    console.error('❌ home-pc failed:', e);
  }

  // task-add-inline (PC)
  try {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    const addBtn = page.locator('button:has-text("+"), button:has-text("追加"), button[aria-label*="追加"], button[aria-label*="add"]').first();
    await addBtn.click({ timeout: 5000 });
    await page.waitForTimeout(300);
    await capture(page, 'task-add-inline-pc', 'pc');
  } catch (e) {
    console.error('❌ task-add-inline-pc failed:', e);
  }

  // task-drag-drop (PC)
  try {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      const items = document.querySelectorAll('[draggable], [data-dnd-item], li, [role="listitem"]');
      if (items.length > 0) {
        (items[0] as HTMLElement).style.opacity = '0.5';
        (items[0] as HTMLElement).style.transform = 'scale(1.02)';
        (items[0] as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
      }
    });
    await capture(page, 'task-drag-drop', 'pc');
  } catch (e) {
    console.error('❌ task-drag-drop failed:', e);
  }

  // calendar-pc
  try {
    await page.goto(`${BASE_URL}/calendar`);
    await page.waitForLoadState('networkidle');
    await capture(page, 'calendar-pc', 'pc');
  } catch (e) {
    console.error('❌ calendar-pc failed:', e);
  }

  // categories-list
  try {
    await page.goto(`${BASE_URL}/categories`);
    await page.waitForLoadState('networkidle');
    await capture(page, 'categories-list', 'pc');
  } catch (e) {
    console.error('❌ categories-list failed:', e);
  }

  // category-edit-dialog
  try {
    await page.goto(`${BASE_URL}/categories`);
    await page.waitForLoadState('networkidle');
    const editBtn = page.locator('button:has-text("編集"), button[aria-label*="編集"], button[aria-label*="edit"]').first();
    await editBtn.click({ timeout: 5000 });
    await page.waitForTimeout(300);
    await capture(page, 'category-edit-dialog', 'pc');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  } catch (e) {
    console.error('❌ category-edit-dialog failed:', e);
  }

  // category-delete-dialog
  try {
    await page.goto(`${BASE_URL}/categories`);
    await page.waitForLoadState('networkidle');
    const deleteBtn = page.locator('button:has-text("削除"), button[aria-label*="削除"], button[aria-label*="delete"]').first();
    await deleteBtn.click({ timeout: 5000 });
    await page.waitForTimeout(300);
    await capture(page, 'category-delete-dialog', 'pc');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  } catch (e) {
    console.error('❌ category-delete-dialog failed:', e);
  }

  // settings
  try {
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('networkidle');
    await capture(page, 'settings', 'pc');
  } catch (e) {
    console.error('❌ settings failed:', e);
  }
}

export async function runMobileScenarios(page: Page): Promise<void> {
  // home-mobile
  try {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    await capture(page, 'home-mobile', 'mobile');
  } catch (e) {
    console.error('❌ home-mobile failed:', e);
  }

  // task-add-inline (mobile)
  try {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    const addBtn = page.locator('button:has-text("+"), button:has-text("追加"), button[aria-label*="追加"], button[aria-label*="add"]').first();
    await addBtn.click({ timeout: 5000 });
    await page.waitForTimeout(300);
    await capture(page, 'task-add-inline-mobile', 'mobile');
  } catch (e) {
    console.error('❌ task-add-inline-mobile failed:', e);
  }

  // calendar-mobile
  try {
    await page.goto(`${BASE_URL}/calendar`);
    await page.waitForLoadState('networkidle');
    await capture(page, 'calendar-mobile', 'mobile');
  } catch (e) {
    console.error('❌ calendar-mobile failed:', e);
  }

  // filter-panel (mobile)
  try {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    const filterBtn = page.locator('button:has-text("フィルタ"), button[aria-label*="フィルタ"], button[aria-label*="filter"]').first();
    await filterBtn.click({ timeout: 5000 });
    await page.waitForTimeout(300);
    await capture(page, 'filter-panel', 'mobile');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  } catch (e) {
    console.error('❌ filter-panel failed:', e);
  }
}

export async function runLoginScenarios(page: Page): Promise<void> {
  // login (PC, no auth)
  try {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await capture(page, 'login', 'pc');
  } catch (e) {
    console.error('❌ login failed:', e);
  }

  // forgot-password (PC, no auth)
  try {
    await page.goto(`${BASE_URL}/forgot-password`);
    await page.waitForLoadState('networkidle');
    await capture(page, 'forgot-password', 'pc');
  } catch (e) {
    console.error('❌ forgot-password failed:', e);
  }
}
