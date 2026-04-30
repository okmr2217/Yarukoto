import type { Scenario } from 'shot-kit';

const scenarios: Scenario[] = [
  // ----------------------------------------------------------------
  // PC — authenticated
  // ----------------------------------------------------------------
  { name: 'ホーム_PC', path: '/', device: 'pc' },

  {
    name: 'タスク追加モーダル_PC',
    path: '/',
    device: 'pc',
    action: async (page) => {
      await page.locator('button[aria-label="タスクを追加"]').first().click({ timeout: 5000 });
      await page.waitForTimeout(300);
    },
  },

  { name: '統計_カテゴリ_PC', path: '/stats', device: 'pc' },
  { name: '統計_日別_PC', path: '/stats?tab=daily', device: 'pc' },
  { name: 'カテゴリ一覧_PC', path: '/categories', device: 'pc' },
  { name: '設定_PC', path: '/settings', device: 'pc' },

  // ----------------------------------------------------------------
  // Mobile — authenticated
  // ----------------------------------------------------------------
  { name: 'ホーム_モバイル', path: '/', device: 'mobile' },

  {
    name: 'タスク追加モーダル_モバイル',
    path: '/',
    device: 'mobile',
    action: async (page) => {
      await page.locator('button[aria-label="タスクを追加"]').first().click({ timeout: 5000 });
      await page.waitForTimeout(300);
    },
  },

  { name: '統計_カテゴリ_モバイル', path: '/stats', device: 'mobile' },
  { name: '統計_日別_モバイル', path: '/stats?tab=daily', device: 'mobile' },
  { name: 'カテゴリ一覧_モバイル', path: '/categories', device: 'mobile' },
  { name: '設定_モバイル', path: '/settings', device: 'mobile' },

  // ----------------------------------------------------------------
  // PC — unauthenticated (ログイン前の画面)
  // ----------------------------------------------------------------
  { name: 'ログイン', path: '/login', device: 'pc', requiresAuth: false },
  { name: '新規登録', path: '/signup', device: 'pc', requiresAuth: false },
];

export default scenarios;
