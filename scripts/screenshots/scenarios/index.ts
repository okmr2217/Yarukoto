import { Page } from 'playwright';
import { capture } from '../utils/capture';
import { CONFIG } from '../config';

/**
 * スクリーンショット シナリオ一覧
 *
 * PC シナリオ (runPcScenarios)
 *   home-pc              / — ホーム（タスク一覧、3カラムレイアウト）
 *   task-add-modal-pc    / — タスク追加モーダルを開いた状態
 *   task-drag-drop       / — ドラッグ中演出を適用したタスク一覧
 *   stats-pc             /stats — 統計ページ
 *   categories-list      /categories — カテゴリ一覧
 *   category-edit-dialog /categories — カテゴリ編集ダイアログを開いた状態
 *   category-delete-dialog /categories — カテゴリ削除ダイアログを開いた状態
 *   settings             /settings — 設定ページ
 *   help-pc              /help — ヘルプページ
 *
 * モバイル シナリオ (runMobileScenarios)
 *   home-mobile          / — ホーム（ボトムナビ付き）
 *   task-add-modal-mobile / — タスク追加モーダルを開いた状態
 *   stats-mobile         /stats — 統計ページ
 *   filter-bottom-sheet  / — フィルター FAB からボトムシートを開いた状態
 *   menu-bottom-sheet    / — ボトムナビのメニューボタンからシートを開いた状態
 *
 * ログインシナリオ (runLoginScenarios) ※認証不要
 *   login                /login — ログインページ
 *   signup               /signup — 新規登録ページ
 *   forgot-password      /forgot-password — パスワードリセット申請ページ
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

  // stats-pc — カレンダー廃止、統計ページに変更
  try {
    await page.goto(`${BASE_URL}/stats`);
    await page.waitForLoadState('networkidle');
    await capture(page, 'stats-pc', 'pc');
  } catch (e) {
    console.error('❌ stats-pc failed:', e);
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

  // help-pc
  try {
    await page.goto(`${BASE_URL}/help`);
    await page.waitForLoadState('networkidle');
    await capture(page, 'help-pc', 'pc');
  } catch (e) {
    console.error('❌ help-pc failed:', e);
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

  // stats-mobile — カレンダー廃止、統計ページに変更
  try {
    await page.goto(`${BASE_URL}/stats`);
    await page.waitForLoadState('networkidle');
    await capture(page, 'stats-mobile', 'mobile');
  } catch (e) {
    console.error('❌ stats-mobile failed:', e);
  }

  // filter-bottom-sheet (mobile) — FilterFab をクリックしてボトムシートを開く
  try {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    const filterFab = page.locator('button[aria-label="フィルターを開く"]').first();
    await filterFab.click({ timeout: 5000 });
    await page.waitForTimeout(300);
    await capture(page, 'filter-bottom-sheet', 'mobile');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  } catch (e) {
    console.error('❌ filter-bottom-sheet failed:', e);
  }

  // menu-bottom-sheet (mobile) — ボトムナビのメニューボタンをクリック
  try {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    const menuBtn = page.locator('nav button:has-text("メニュー")').first();
    await menuBtn.click({ timeout: 5000 });
    await page.waitForTimeout(300);
    await capture(page, 'menu-bottom-sheet', 'mobile');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  } catch (e) {
    console.error('❌ menu-bottom-sheet failed:', e);
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

  // forgot-password (PC, no auth)
  try {
    await page.goto(`${BASE_URL}/forgot-password`);
    await page.waitForLoadState('networkidle');
    await capture(page, 'forgot-password', 'pc');
  } catch (e) {
    console.error('❌ forgot-password failed:', e);
  }
}
