# Refactor Log

REFACTOR_PLAN.md から振る舞いを変えない項目を自律実行した記録。

---

## 実行したコミット（9件）

### 1. 未使用レイアウトコンポーネントを削除 `7fb49d3`
- 削除: `filter-panel.tsx`, `filter-panel-context.tsx`, `date-navigation.tsx`, `header.tsx`, `sidebar.tsx`, `search-column.tsx`
- `FilterValues` 型は `filter-bottom-sheet.tsx` に移動して export を維持
- 対応: 計画書 6.1 / 4.6

### 2. 未使用の task-create-dialog と hooks を削除 `6d44f0f`
- 削除: `task-create-dialog.tsx`, `use-today-tasks.ts`, `use-category-stats.ts`
- `hooks/index.ts` から対応する re-export を除去
- 対応: 計画書 6.1 / 6.2

### 3. 未使用の shadcn UI コンポーネントを削除 `1d3fd1c`
- 削除: `badge.tsx`, `calendar.tsx`, `drawer.tsx`, `popover.tsx`, `scroll-area.tsx`, `separator.tsx`, `switch.tsx`
- 対応: 計画書 6.2

### 4. 未使用のサーバーアクション関数・型・スキーマを削除 `fd07875`
- 削除: `getTasksByDate`, `searchTasks` 関数本体（task-queries.ts から）
- 削除: `getCategoryStats` 関数（category.ts から）および actions/index.ts の export
- 削除: `getTasksByDateSchema`, `searchTasksSchema`, `GetTasksByDateInput`, `SearchTasksInput`（validations/task.ts）
- 削除: `DateTasks`, `SearchTasksResult` 型（types/task.ts）
- 対応: 計画書 6.1 / 6.2

### 5. 未使用の定数を削除 `b5e2053`
- 削除: `CATEGORY_COLORS`（types/category.ts）— `COLOR_PRESETS` と重複かつ参照なし
- 削除: `QUERY_KEYS`（lib/constants.ts）— 呼び出し元なし
- 対応: 計画書 3.3 / 6.2

### 6. `any` 型を Prisma 型に置換 `d18c195`
- `task-queries.ts` の `andConditions: any[]` → `Prisma.TaskWhereInput[]`
- `task-queries.ts` の `categoryFilter: any` → `Prisma.TaskWhereInput["categoryId"]`
- `task-queries.ts` の `where: any` → `Prisma.TaskWhereInput`（動的代入を spread に変更）
- `task-mutations.ts` の `updateData: any` → `Prisma.TaskUpdateInput`
- 対応: 計画書 3.2

### 7. bottom-nav の NAV_ITEMS 二重定義を解消 `db7c3e7`
- `bottom-nav.tsx` のローカル定義を削除し、`lib/constants` の `NAV_ITEMS` + `iconMap` パターンに統一
- pc-header.tsx と同じアプローチで整合性を確保
- 対応: 計画書 1.6

### 8. isLoaded dead guard を削除 `e8e9b5e`
- `use-theme.ts` の `isLoaded = true` を削除、useEffect 依存配列から除去
- `theme-provider.tsx` の `if (!isLoaded) return null` を削除
- 対応: 計画書 4.1

### 9. `utils/categoryGroup.ts` を `lib/` に移動 `6222e4a`
- `src/utils/` ディレクトリを解消し `src/lib/categoryGroup.ts` に統合
- `category-selector.tsx` と `group-edit-dialog.tsx` の import パスを更新
- 対応: 計画書 5.1

---

## スキップした項目と理由

| 項目 | 理由 |
|---|---|
| **1.1 フィルター UI 三兄弟の共通化** | コスト L・大規模リファクタ。振る舞いに影響する可能性あり |
| **1.2 TaskInputModal / TaskEditDialog の統合** | コスト M・ロジック差分の精査が必要 |
| **1.3 DnD ページ共通化** | コスト M・共通コンポーネント抽出は設計変更を伴う |
| **1.4 楽観更新ボイラープレート集約** | コスト M・抽象化の導入が禁止条件に抵触 |
| **1.5 getCategoryStats / getCategoryGroupStats 集計ロジック** | getCategoryStats 削除済み。getCategoryGroupStats はこれ以上共通化できない |
| **2.1〜2.6 大ファイルの分割** | コスト L/M・ディレクトリ再編を伴う |
| **3.1 StatusFilter 等の型統合** | filter-sidebar / filter-bottom-sheet で局所的に使われており、共有型に上げると設計変更を伴う |
| **3.4 null/undefined セマンティクス修正** | schema で min(1) 担保済み・実害なし。振る舞い変更のリスクあり |
| **4.2 フォーカス処理の改善** | useEffect + setTimeout の変更は振る舞いに影響する可能性あり |
| **4.3 キーボードイベント useEffect の最適化** | 実害小・振る舞い変更のリスクあり |
| **4.4 派生 state 同期パターン** | 大規模共通化が前提（1.1 と同スコープ） |
| **4.5 Props バケツリレー** | viewMode の URL 化が必要で設計変更を伴う |
| **5.2 layout/ ディレクトリの再編** | 禁止条件「ディレクトリ構成の全面変更」に抵触 |
| **5.3 types/ の整理** | 型の統合は影響範囲が大きい |
| **5.4 hooks/ の整理** | フラット構成の変更は設計変更を伴う |
| **6.1 category-filter.tsx** | FilterArea 経由で現役使用中・UI 確認が必要 |
| **6.2 getTaskDetail の削除** | actions/index.ts で公開 export されており API 破壊に抵触 |
| **7.x shadcn/Tailwind の使い方** | ライブラリ追加・全面変更が禁止条件に抵触 |
| **8.x DB クエリ最適化** | raw SQL 採用やスキーマ変更が必要 |

---

## 削除行数サマリ

| カテゴリ | 削除行数（概算） |
|---|---|
| 未使用レイアウトコンポーネント | ~1,050 行 |
| 未使用タスクコンポーネント・hooks | ~660 行 |
| 未使用 UI コンポーネント | ~570 行 |
| 未使用アクション・型・スキーマ | ~260 行 |
| 未使用定数 | ~20 行 |
| **合計** | **~2,560 行** |
