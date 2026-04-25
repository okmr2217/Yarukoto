import { Page } from 'playwright';
import { capture } from '../utils/capture';
import { CONFIG } from '../config';

/**
 * スクリーンショット シナリオ一覧
 *
 * PC シナリオ (runPcScenarios)
 *   home-pc              / — ホーム（タスク一覧、3カラムレイアウト）
 *   task-add-modal-pc    / — タスク追加モーダルを開いた状態
 *   stats-category-pc             /stats — 統計ページ（カテゴリタブ）
 *   stats-daily-pc             /stats — 統計ページ（日次タブ）
 *   categories-list      /categories — カテゴリ一覧
 *   settings             /settings — 設定ページ
 *
 * モバイル シナリオ (runMobileScenarios)
 *   home-mobile              / — ホーム（タスク一覧、3カラムレイアウト）
 *   task-add-modal-mobile    / — タスク追加モーダルを開いた状態
 *   stats-category-mobile             /stats — 統計ページ（カテゴリタブ）
 *   stats-daily-mobile             /stats — 統計ページ（日次タブ）
 *   categories-list-mobile      /categories — カテゴリ一覧
 *   settings-mobile             /settings — 設定ページ
 *
 * ログインシナリオ (runLoginScenarios) ※認証不要
 *   login                /login — ログインページ
 *   signup               /signup — 新規登録ページ
 */

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

  // task-add-modal (PC) — TaskFab をクリックしてモーダルを開く
  try {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    const addBtn = page.locator('button[aria-label="タスクを追加"]').first();
    await addBtn.click({ timeout: 5000 });
    await page.waitForTimeout(300);
    await capture(page, 'task-add-modal-pc', 'pc');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  } catch (e) {
    console.error('❌ task-add-modal-pc failed:', e);
  }

  // stats-category-pc — 統計ページ（カテゴリタブ、デフォルト）
  try {
    await page.goto(`${BASE_URL}/stats`);
    await page.waitForLoadState('networkidle');
    await capture(page, 'stats-category-pc', 'pc');
  } catch (e) {
    console.error('❌ stats-category-pc failed:', e);
  }

  // stats-daily-pc — 統計ページ（日次タブ）
  try {
    await page.goto(`${BASE_URL}/stats?tab=daily`);
    await page.waitForLoadState('networkidle');
    await capture(page, 'stats-daily-pc', 'pc');
  } catch (e) {
    console.error('❌ stats-daily-pc failed:', e);
  }

  // categories-list
  try {
    await page.goto(`${BASE_URL}/categories`);
    await page.waitForLoadState('networkidle');
    await capture(page, 'categories-list', 'pc');
  } catch (e) {
    console.error('❌ categories-list failed:', e);
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

  // task-add-modal (mobile) — TaskFab をクリックしてモーダルを開く
  try {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    const addBtn = page.locator('button[aria-label="タスクを追加"]').first();
    await addBtn.click({ timeout: 5000 });
    await page.waitForTimeout(300);
    await capture(page, 'task-add-modal-mobile', 'mobile');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  } catch (e) {
    console.error('❌ task-add-modal-mobile failed:', e);
  }

  // stats-category-mobile — 統計ページ（カテゴリタブ、デフォルト）
  try {
    await page.goto(`${BASE_URL}/stats`);
    await page.waitForLoadState('networkidle');
    await capture(page, 'stats-category-mobile', 'mobile');
  } catch (e) {
    console.error('❌ stats-category-mobile failed:', e);
  }

  // stats-daily-mobile — 統計ページ（日次タブ）
  try {
    await page.goto(`${BASE_URL}/stats?tab=daily`);
    await page.waitForLoadState('networkidle');
    await capture(page, 'stats-daily-mobile', 'mobile');
  } catch (e) {
    console.error('❌ stats-daily-mobile failed:', e);
  }

  // categories-list-mobile
  try {
    await page.goto(`${BASE_URL}/categories`);
    await page.waitForLoadState('networkidle');
    await capture(page, 'categories-list-mobile', 'mobile');
  } catch (e) {
    console.error('❌ categories-list-mobile failed:', e);
  }

  // settings-mobile
  try {
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('networkidle');
    await capture(page, 'settings-mobile', 'mobile');
  } catch (e) {
    console.error('❌ settings-mobile failed:', e);
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

  // signup (PC, no auth)
  try {
    await page.goto(`${BASE_URL}/signup`);
    await page.waitForLoadState('networkidle');
    await capture(page, 'signup', 'pc');
  } catch (e) {
    console.error('❌ signup failed:', e);
  }
}
