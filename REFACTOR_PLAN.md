# Refactor Plan

`yarukoto` リポジトリのリファクタリング候補。コードは変更していない。
（観点別に列挙し、最後に「先にやるべき TOP5」を示す）

---

## 1. 重複コード（同じロジック・似たコンポーネントが複数箇所にある）

### 1.1 フィルター UI 三兄弟
- 場所: `src/components/layout/filter-sidebar.tsx` (1–679) / `filter-bottom-sheet.tsx` (1–384) / `search-column.tsx` (1–488)
- 何が問題か:
  - `STATUS_OPTIONS`, `KEYWORD_DEBOUNCE_MS` がそれぞれの先頭で定義されている
  - `updateSearchParams`, キーワードの IME 対応デバウンス（`isComposingRef` + `commitKeyword` + `handleCompositionEnd` + `handleKeywordClear`）がほぼ同一コードで 3 回（+ `filter-panel.tsx` を含めると 4 回）書かれている
  - 「前日 / 当日 / 翌日 / クリア」の日付ナビ UI、「お気に入りのみ」チェック UI、ステータスチップ、カテゴリリスト、ソートチップ等の長い Tailwind クラスチェーンがコピペ
  - `derived state pattern`（`if (keyword !== syncedKeyword) setSyncedKeyword(...)`）も 3〜4 箇所に重複
- 想定リスク: 1 箇所変更を入れたとき、もう片方が更新漏れ → mobile/desktop で挙動差。実際 `search-column` は `sort` URL パラメータを使う一方、`filter-sidebar` は `viewMode` ベースの listSort/scheduledSort と異なるモデルを持っており、すでに divergence が始まっている。
- コスト: **L** （3 ファイル合計 1,500 行以上、責務分割が前提）
- 効果: **L** （バグ温床の根本除去、共通フィルターロジックの一元化）

### 1.2 `TaskInputModal` と `TaskEditDialog` の重複
- 場所: `src/components/task/task-input-modal.tsx` (1–246) と `src/components/task/task-edit-dialog.tsx` (1–247)
- 何が問題か: タスク名 textarea の auto-resize、メモ textarea、`CategorySelector` 呼び出し、`日付ピックアップ4ボタン (なし/今日/明日/選択)`、submit hotkey (Ctrl+Enter)、モバイル時の Enter で submit/Tab 切り分け—ロジック・JSX ともほぼ同一。差分は「タイトル文言」「初期値の出所」「submit 後のリセット有無」程度。
- 想定リスク: フォームの UI 改善や validation 強化が片方だけ反映されて drift（TaskCreateDialog は drift 済の遺物：項目 6.1 参照）。
- コスト: **M**
- 効果: **M**

### 1.3 ドラッグ並び替えページの重複（カテゴリ / グループ）
- 場所: `src/app/(app)/categories/page.tsx` (50–296) と `src/app/(app)/groups/page.tsx` (40–181)
- 何が問題か: `SortableXxxRow` / `XxxRowOverlay`、`useSensors(PointerSensor + TouchSensor{delay:200,tolerance:5})`、`handleDragStart/handleDragEnd`、`queryClient.setQueryData<Xxx[]>` → `mutate({ onError: rollback })` がコピペ。
- 想定リスク: DnD の挙動修正やアクセシビリティ改善時の drift。
- コスト: **M**（共通 `<SortableList items handlers>` を抽出）
- 効果: **M**

### 1.4 `useTaskMutations` 内のオプティミスティック更新ボイラープレート
- 場所: `src/hooks/use-task-mutations.ts` (110–471)
- 何が問題か: 各 mutation で `cancelAllQueries → snapshotCache → updater → onError: rollbackCache → onSettled: invalidateAll` という同じ骨格が 9 回出てくる。`updateAllTasksCache` / `updateAllTasksCacheWithFilters` を作っているのに、結局 `create` と `reorder` だけは独自に書いている。
- 想定リスク: 楽観更新の一部だけ rollback 漏れ・filter 連動漏れ。
- コスト: **M**
- 効果: **M**

### 1.5 `getCategoryStats` と `getCategoryGroupStats` の集計ロジックが二重
- 場所: `src/actions/category.ts` (280–446)
- 何が問題か: タスクをカテゴリ別 `CategoryStats` Map に集計するブロックが両関数に同じコードで存在。後者はその上にグループでまとめなおすだけ。さらに前者は完全に未使用（項目 6 参照）。
- 想定リスク: 集計ルール（overdue 判定、archived の扱いなど）の drift。
- コスト: **S**
- 効果: **S**

### 1.6 `NAV_ITEMS` 二重定義
- 場所: `src/lib/constants.ts:87` と `src/components/layout/bottom-nav.tsx:10`
- 何が問題か: グローバル定数があるのに `bottom-nav.tsx` だけ自前定義（しかも 3 項目だけ）。`Header`/`PCHeader`/`MenuBottomSheet` は constants 側を使っている。
- 想定リスク: 新規ナビ追加時に bottom-nav が漏れる。
- コスト: **S**
- 効果: **S**

### 1.7 LocalStorage トグル系 hooks の重複
- 場所: `src/hooks/use-group-expanded.ts` (1–35) と `src/hooks/use-category-group-filter.ts` (16–43, `useCategoryGroupCollapsed`)
- 何が問題か: `Record<string, boolean>` を localStorage に永続化する pattern が同じ。違いは「key」と「default = expanded か collapsed か」。
- コスト: **S**
- 効果: **S**

### 1.8 カラー rgba パターン埋め込みの繰り返し
- 場所: `filter-sidebar.tsx`, `search-column.tsx`, `category-chip.tsx`, `category-group-accordion.tsx`, `category-selector.tsx`, `task-card.tsx`
- 何が問題か: `style={{ backgroundColor: \`${color}26\` }}` / `\`${color}28\`` / `\`${color}14\`` / `\`${color}aa\`` などの 8 桁 hex を直書き。透明度の意味が散在し、トーン統一が壊れやすい。
- コスト: **S**（`tints(color)` のような helper 1 関数）
- 効果: **S**

---

## 2. 責務が大きすぎるファイル/関数/コンポーネント

### 2.1 `FilterSidebar` 679 行
- 場所: `src/components/layout/filter-sidebar.tsx`
- 何が問題か: ステータス・ビュー・日付・カテゴリツリー・キーワード・お気に入り・並び替えの 7 セクションを 1 コンポーネントで実装。`useAllTasks` を 2 回呼んで件数集計、`AccordionSection` を内部定義、URL 同期、IME 対応 debounce、ungrouped 仮想グループの分岐をすべて inline。
- 想定リスク: 小さな仕様変更ごとにファイル全体を読む必要がある。React DevTools での props/state 把握が困難。
- コスト: **L**（カテゴリツリー、キーワード入力、ステータスチップ、ソート選択を分離）
- 効果: **L**

### 2.2 `app/(app)/page.tsx` 470 行
- 場所: `src/app/(app)/page.tsx`
- 何が問題か:
  - `categoryFilter` 4 種・`viewMode`・`listSort`/`scheduledSort` 状態、`prevStatusFilter` パターンを使って sort 自動切替するロジック、`taskCategoryIds` 派生計算、`sortedTasks` クライアントソート、2 つの大きな `useEffect`（n キー・数字キー）、`getMatchReasons`、ローディングと通常で **JSX を二重定義**（FilterSidebar + main + FilterBottomSheet を 2 ヶ所で同じ props で書いている）
  - `taskHandlers` の生成が毎レンダー。
- 想定リスク: ローディング側だけ修正漏れ、数字キー → カテゴリ切替が categories order に強依存し categories の並びが変わると壊れる。
- コスト: **L**
- 効果: **L**

### 2.3 `getMonthlyTaskStats` 関数 ~170 行
- 場所: `src/actions/task/task-queries.ts:311-482`
- 何が問題か: 月の全タスクを `findMany` で取得し、JS 上で日付ごとに total/completed/createdCount/overdue/skipped を集計。さらに `completedCategories` Map を別管理。1 関数 / 1 ファイル内の責務が大きい。
- 想定リスク: タスク数増加時の O(n) JS 集計コストとデータ転送量。
- コスト: **M**
- 効果: **M**（項目 8 参照）

### 2.4 `task-queries.ts` (524) / `task-mutations.ts` (501) / `actions/category.ts` (476) / `use-task-mutations.ts` (472)
- 何が問題か: それぞれ単一ファイルで 9〜10 個のサーバーアクション or 9 個の mutation を保持。CLAUDE.md の「500 行以内目安」を超過。
- コスト: **M** （ドメイン別に分割: `task-status-mutations.ts` / `task-favorite.ts` / `task-reorder.ts` 等）
- 効果: **S**（純粋に可読性）

### 2.5 `categories/page.tsx` 468 / `settings/page.tsx` 447 / `stats/page.tsx` 304
- 場所: 各ページコンポーネント
- 何が問題か: ページ直下で 3〜4 個の小コンポーネント（`SortableCategoryRow`, `ArchivedCategoryRow`, `CategoryRowOverlay`, `CategoryCard`, `GroupSection` など）を定義。ページ自体は表示・状態・mutation・アラートを抱える。
- コスト: **M**
- 効果: **M**

### 2.6 `task-card.tsx` 322 行
- 場所: `src/components/task/task-card.tsx`
- 何が問題か: 内部に `StopPropagation`, `TaskCardActions`, `TaskCardMeta`, `BASE_ACTIONS`/`SKIPPED_BASE_ACTIONS`/`FAVORITE_ACTION`/`UNFAVORITE_ACTION` 定数群を抱える。`timeEntries` の useMemo + flashing state + DnD ハンドル。1 ファイル責務が多い割には許容範囲だが分割可。
- コスト: **S**
- 効果: **S**

---

## 3. 型定義の重複・`any` の濫用

### 3.1 `StatusFilter` / `ViewMode` / `SortOrder` 系の重複
- 場所:
  - `filter-sidebar.tsx:14-17` で `StatusFilter` / `ViewMode` / `ListSortOrder` / `ScheduledSortOrder` を定義（一部 export）
  - `filter-bottom-sheet.tsx:12-15` で同じ 4 型を再定義（export なし）
  - `search-column.tsx:14-15` で `StatusFilter` / `SortOrder` を**別シグネチャ**（`SortOrder` に `completedAt`/`skippedAt` を追加）で再定義
  - `app/(app)/page.tsx:53-58` で `as FilterValues["status"]` でキャスト、`viewMode` は `as "list" | "schedule"`、`listSort` / `scheduledSort` は `useState<...>` の inline literal
- 何が問題か: 同じ概念に 3 つの型定義が散らばり、`SortOrder` だけ仕様が異なる。Zod スキーマ (`getAllTasksSchema.status` の enum) からの推論を共有できる場面で手書き重複。
- 想定リスク: enum 値追加時に同期漏れ。
- コスト: **S**
- 効果: **M**（型起点で機能差 drift を検知できるようになる）

### 3.2 Prisma クエリ条件の `any`
- 場所: `src/actions/task/task-queries.ts:150, 226, 257, 271` および `src/actions/task/task-mutations.ts:129`
- 何が問題か: いずれも `// eslint-disable-next-line @typescript-eslint/no-explicit-any` 付きで `where: any`, `andConditions: any[]`, `categoryFilter: any`, `updateData: any` を使用。Prisma の `Prisma.TaskWhereInput` / `Prisma.TaskUpdateInput` が利用可能（generated/prisma に存在）。CLAUDE.md は `any` 禁止と明記。
- 想定リスク: フィールド名・型の typo が見逃される。Prisma スキーマ変更で壊れたことを実行時まで気づかない。
- コスト: **S**
- 効果: **M**

### 3.3 `CATEGORY_COLORS` と `COLOR_PRESETS` の二重化
- 場所: `src/types/category.ts:37-45`（7 色） vs `src/constants/colors.ts:1-18`（16 色）
- 何が問題か: 前者は完全未使用（項目 6 参照）。型 vs 定数の境界曖昧。
- コスト: **S**
- 効果: **S**

### 3.4 `useTaskMutations.update` の null/undefined セマンティクス
- 場所: `src/hooks/use-task-mutations.ts:185-202`
- 何が問題か: `updateTaskSchema` は `categoryId/scheduledAt/memo` を `null | string | undefined` 三態として定義しているが、楽観更新の updater 内で `input.scheduledAt === undefined ? task.scheduledAt : input.scheduledAt` のような分岐は明示的なものの、`title` だけ `?? task.title` を使っているため空文字 `""` が来た場合に意図せず元値維持になる。
- 想定リスク: 軽微（schema で `min(1)` を担保しているので実害は小さいが、null/undefined の取り扱いをコンポーネント全体で統一したい）。
- コスト: **S**
- 効果: **S**

---

## 4. 古い書き方・不要な useEffect・Props バケツリレー

### 4.1 `ThemeProvider` のデッドガード
- 場所: `src/components/theme-provider.tsx:9` + `src/hooks/use-theme.ts:39`
- 何が問題か: `use-theme.ts` で `const isLoaded = true;` がハードコード → `if (!isLoaded) return null;` は永遠に偽。本来 hydration 後の判定として導入された痕跡だが、現状はゼロ意味。
- 想定リスク: 「読み込み完了まで待つ」と勘違いした読み手のミスリード。
- コスト: **S**
- 効果: **S**

### 4.2 `task-input-modal.tsx` / `task-edit-dialog.tsx` のフォーカス処理
- 場所: `task-input-modal.tsx:66-72` と `task-edit-dialog.tsx:55-65`
- 何が問題か: `useEffect(() => { if (open) setTimeout(() => focus, 100) }, [open])` のような任意 timeout を使ってフォーカスしている。Radix Dialog は `onOpenAutoFocus` / `autoFocus` のフックを提供する。textarea の自動高さ計算も `useEffect` + `requestAnimationFrame` 重ねがけ。CSS の `field-sizing: content;` で代替可。
- 想定リスク: 100ms タイマーが iOS の Soft Keyboard と噛む、ResizeObserver の置き換え漏れ。
- コスト: **S**
- 効果: **S**

### 4.3 `app/(app)/page.tsx` の キーボードイベント `useEffect`
- 場所: `src/app/(app)/page.tsx:219-253`
- 何が問題か: 数字キー → カテゴリトグルの `useEffect` が `[categories, categoryFilter, taskInputOpen, editingTask, handleCategoryFilterChange]` 依存で、毎フィルター変更で `addEventListener / removeEventListener` を再登録する。`useRef` に最新 state を載せ、effect は mount 時のみ装着する形が一般的。
- 想定リスク: スクロール中に短時間 listener が外れるエッジ。実害は小さいが古いパターン。
- コスト: **S**
- 効果: **S**

### 4.4 「派生 state を `if (a !== b) setB(...)` で同期」パターンの蔓延
- 場所: `filter-sidebar.tsx:113-116`, `filter-bottom-sheet.tsx:75-78`, `search-column.tsx:70-73`, `filter-panel.tsx:41-44`, `category-selector.tsx:87-93`
- 何が問題か: React 18 でも許容される使い方だが、4〜5 箇所で同じ「URL クエリ↔ローカル keyword」「外部 selectedCategoryId↔内部 activeGroupId」を同期。共通 hook `useUrlSyncedKeyword` 等に括れる。
- コスト: **S**
- 効果: **S**

### 4.5 Props バケツリレー（FilterBottomSheet）
- 場所: `src/app/(app)/page.tsx:320-328, 413-421`（loading/main の 2 箇所）と `filter-bottom-sheet.tsx`
- 何が問題か: `viewMode/onViewModeChange/listSort/onListSortChange/scheduledSort/onScheduledSortChange` を `page → FilterSidebar` と `page → FilterBottomSheet` の両方に手で配っている。`useSearchParams` を直接読み書きしている filter コンポーネントが既にあるのに、さらに props で同じ意味を二重配信している箇所がある（viewMode は URL 由来、listSort/scheduledSort は親 `useState`、混在）。
- 想定リスク: URL 共有時に listSort/scheduledSort だけ消える（既に当機能ではそう）。
- コスト: **M**（sort も URL 化、もしくは `FilterPanelContext` 整備）
- 効果: **M**

### 4.6 `filter-panel-context.tsx` の Provider/Hook が孤立
- 場所: `src/components/layout/filter-panel-context.tsx:12, 26`
- 何が問題か: `FilterPanelProvider` / `useFilterPanel` を export しているが import する場所が一つもない。Provider 駆動でモバイルシートの開閉を上げる設計の名残。
- コスト: **S**
- 効果: **S**（削除）

---

## 5. ディレクトリ構成の歪み

### 5.1 `src/utils/` と `src/lib/` の境界
- 場所: `src/utils/categoryGroup.ts` (7 行) のみ。あとはすべて `src/lib/`
- 何が問題か: 1 ファイルだけのために `utils/` が存在し、ヘルパーがどこにあるか探しづらい。
- 想定リスク: 新規ヘルパーの置き場ブレ。
- コスト: **S**
- 効果: **S**

### 5.2 `components/layout/` がレイアウト以外を抱えている
- 場所: `src/components/layout/`
- 何が問題か: 真にレイアウトのもの（`Header`, `PCHeader`, `BottomNav`, `MenuBottomSheet`, `Sidebar`）と、機能別フィルター UI（`FilterSidebar`, `FilterBottomSheet`, `FilterPanel`, `FilterArea`, `FilterFab`, `CategoryFilter`, `CategoryGroupAccordion`, `CategoryChip`, `DateNavigation`, `DueDateAlertChip`, `SearchColumn`, `FilterSectionInfo`, `FilterPanelContext`）が同居。本質は「タスク一覧画面のフィルター機能」群。
- 想定リスク: 「これはどこに置くべきか」判断が毎回必要、`features/filter/` 的単位への分割を阻害。
- コスト: **M**（移動 + import パス更新）
- 効果: **M**

### 5.3 `src/types/index.ts` がほぼ空、`Group` だけ別ファイル
- 場所: `src/types/`
- 何が問題か: `task.ts`(71)、`category.ts`(45)、`group.ts`(10)、`action-result.ts`(19)、`index.ts`(4) と細かく分かれている。`Group` 10 行・`ActionResult` 19 行はインライン化 or 統合可。
- コスト: **S**
- 効果: **S**

### 5.4 `hooks/` に複数粒度が混在
- 場所: `src/hooks/`
- 何が問題か: 集約 hook (`useTaskMutations`)、機能別単発 hook (`useDueDateAlerts`)、URL 永続化 (`useGroupExpanded`, `useCategoryGroupCollapsed`)、テーマ・ストレージ系などがフラットに 17 ファイル。
- コスト: **S**
- 効果: **S**

---

## 6. 未使用のファイル・export・依存パッケージ

### 6.1 削除候補ファイル（コード本体）
| ファイル | 行数 | 状態 |
|---|---|---|
| `src/components/task/task-create-dialog.tsx` | 234 | どこからも import されていない。中で `priority` (`HIGH/MEDIUM/LOW`) を扱うが既に廃止されたフィールド。 |
| `src/hooks/use-today-tasks.ts` | 400 | ここが export する `useCreateTask/useUpdate.../useDelete.../useSkipTask/useUnskipTask/useCompleteTask/useUncompleteTask` は **`hooks/index.ts` での再 export 以外に呼ばれていない**。実際の mutation は `useTaskMutations` が担当。`TodayTasks` 型もここでしか使われていない（`types/task.ts` は別途定義あり）。 |
| `src/components/layout/filter-panel.tsx` | 218 | 未使用。 |
| `src/components/layout/filter-panel-context.tsx` | 30 | 未使用 Provider/Hook。 |
| `src/components/layout/sidebar.tsx` | 117 | どこからも import されていない。 |
| `src/components/layout/search-column.tsx` | 488 | `Sidebar` 経由でのみ使われる → 推移的に未使用。`category-chip.tsx` 内のコメントで参照されているのみ。 |
| `src/components/layout/header.tsx` | 97 | `app/(app)/layout.tsx` は `PCHeader` のみ使用。`Header` は `components/layout/index.ts` で export だけされて import 元なし（モバイルでは `BottomNav` を使用）。 |
| `src/components/layout/date-navigation.tsx` | 93 | 未使用。 |
| `src/components/layout/category-filter.tsx` | 250 | `FilterArea` を経由するルートだけ。`FilterArea` は `app/(app)/page.tsx` のローディング/通常の両方で `<FilterArea categories ... />` として描画される **が**、`CategoryFilter` 自体の機能はモバイルだけのもの（中身を見ると 2 段階アコーディオン）で、現行のモバイル UI は `FilterFab` + `FilterBottomSheet` がメイン → 機能的に死蔵になりかけている。要 UI 確認。 |

合計 **約 1,900 行**の dead code 候補。

### 6.2 削除候補 export（ファイルは残す）
- `src/actions/task/task-queries.ts`: `getTasksByDate`, `searchTasks`, `getTaskDetail` の 3 アクションは index.ts でのみ再 export され、クライアント側からの呼び出しは **0**。`getTasksByDateSchema`, `searchTasksSchema`, それらの `Input` 型も同様。
- `src/actions/category.ts`: `getCategoryStats` (`useCategoryStats`) 同様に未使用。`getCategoryGroupStats` のみ stats ページで使用。
- `src/lib/constants.ts`: `QUERY_KEYS` 定数オブジェクト未使用（`["allTasks"]` 等は呼び出し側で文字列直書き）。
- `src/types/category.ts`: `CATEGORY_COLORS` 未使用（`COLOR_PRESETS` がある）。
- `src/components/ui/`: `badge.tsx`(48), `calendar.tsx`(220), `drawer.tsx`(135), `popover.tsx`(48), `scroll-area.tsx`(58), `separator.tsx`(28), `switch.tsx`(31) — どれもコンポーネントから import されていない。shadcn を入れた当初の追加分。

### 6.3 依存パッケージ
- 場所: `package.json`
- `radix-ui` (パッケージ全体) と `@radix-ui/*` (個別パッケージ) が両方入っている。 `radix-ui` は実コードから import がない（個別パッケージ経由のみ）→ 削除可能性。
- `react-day-picker`：`components/ui/calendar.tsx` の中だけで使用。`calendar.tsx` を消すならこれも削除可。
- `vaul`：`components/ui/drawer.tsx` の中だけで使用。`drawer.tsx` を消すならこれも削除可。
- `pg`, `@types/pg`, `@prisma/adapter-pg`：`prisma.config.ts` で adapter として使われているなら必要。要確認。
- 想定リスク: 純粋に削除するだけなら影響なし（しかし build/test なしには確証できない）。
- コスト: **S**
- 効果: **M**（バンドルサイズ削減）

---

## 7. shadcn/ui や Tailwind の使い方で標準から外れているところ

### 7.1 shadcn の `Button` を使わず生 `<button>` で UI ボタンを多数実装
- 場所: `filter-sidebar.tsx`, `filter-bottom-sheet.tsx`, `search-column.tsx`, `category-filter.tsx`, `category-group-accordion.tsx` 各所
- 何が問題か: ステータスチップ、ソートチップ、カテゴリチップなど 70 箇所超で生 `<button>` + 長い Tailwind class chain（`"flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs transition-colors border ..."`）。`Button` の `variant` を増やすか、`Toggle`/`ToggleGroup` shadcn primitive を導入したほうが整合する。
- 想定リスク: アクセシビリティ（`aria-pressed` を付けるかどうか、disabled 処理）が箇所ごとにバラつく（実際 search-column / filter-sidebar で `aria-pressed` の有無が違う）。
- コスト: **L**
- 効果: **M**

### 7.2 ダークモード色 palette の手書き重複
- 場所: `filter-sidebar.tsx:615-617`, `filter-bottom-sheet.tsx:311-313`, `search-column.tsx:446-448`
- 何が問題か: `bg-yellow-50 border-yellow-300 text-yellow-700 ... dark:bg-yellow-950/30 dark:border-yellow-700 dark:text-yellow-400` の 6 クラス set がコピペで 3 箇所。`favorite` 風 token として CSS variable / Tailwind plugin に切り出すべき。
- コスト: **S**
- 効果: **S**

### 7.3 インラインスタイルでの色透明度組み立て
- 既出（項目 1.8）。Tailwind の opacity utilities や color-mix() で代替可。

### 7.4 `tw-animate-css` の利用
- 場所: `package.json`, `globals.css`
- `animate-in slide-in-from-top-1` 等、アニメーション utility は数か所のみ。コスト極小だが置き場として明示すべき。

---

## 8. Supabase / Prisma クエリの非効率

### 8.1 ホーム画面で `getAllTasks` が多重に走る
- 場所: 同じレンダリングサイクルで以下が走る
  - `app/(app)/page.tsx:119` メインリスト用
  - `filter-sidebar.tsx:121` カテゴリ件数集計用（status / category なし）
  - `filter-sidebar.tsx:149` ステータス件数集計用（status なし）
  - `filter-bottom-sheet.tsx:80` モバイル用ステータス件数（**シートが閉じていても呼ばれる**：`if (!open) return null` は `useAllTasks` の後）
  - `category-filter.tsx:28` `status: pending` だけ呼ぶ
  - `use-due-date-alerts.ts:13` 全件
- 何が問題か: 実質 5〜6 個の `prisma.task.findMany`（include category 付き）が DB に並列発行される。各クエリの結果は重複した task オブジェクトを大量に含み、ネットワーク・サーバ side の負荷が高い。`refetchInterval: 60s` も全クエリで同時に走る。
- 想定リスク: タスク件数が増えると顕著にスローダウン。Vercel 側のサーバーアクション課金にも効く。
- コスト: **L**（`/api/task-counts` 的な集計エンドポイント or 単一の `getAllTasksWithCounts` を作って zustand/context 共有）
- 効果: **L**

### 8.2 `getMonthlyTaskStats` が JS で集計
- 場所: `task-queries.ts:311-482`
- 何が問題か: その月の全該当タスクを `findMany` で取り、JS で日付別カウントを構築。Postgres の `SELECT date_trunc('day', completed_at AT TIME ZONE 'Asia/Tokyo'), count(*) ... GROUP BY 1` で済む話。
- コスト: **M**（生 SQL or `prisma.$queryRaw` 採用）
- 効果: **M**（メモリ・転送量・速度改善。タスクが数百〜数千になった時に効く）

### 8.3 `getCategoryStats` / `getCategoryGroupStats` も同様
- 場所: `actions/category.ts:280-446`
- 何が問題か: 全タスクを `select: { categoryId, status, scheduledAt }` で持ってきて JS 集計。`groupBy` + フィルタで済む。
- コスト: **M**
- 効果: **M**

### 8.4 `getTasksByDate` が 3 クエリ（過去日）
- 場所: `task-queries.ts:72-109`
- 何が問題か: 過去日のとき `completed`, `skipped`, `scheduled` の 3 つの `findMany` を発行。`OR` で 1 クエリにまとめれば往復 1 回で済む。
- コスト: **S**
- 効果: **S**（しかも当該関数は項目 6.2 で未使用候補）

### 8.5 認可ガードの 2 段階クエリ
- 場所: `task-mutations.ts` の `complete/uncomplete/skip/unskip/delete/toggleFavorite` 全部 (162-501)
- 何が問題か: `findFirst({ id, userId })` で所有確認 → `update({ where: { id } })` の 2 クエリ。`updateMany({ where: { id, userId } })` にすると 1 クエリで済むが Prisma は更新後の row を返さないので返値整合がいる。または `prisma.task.update({ where: { id_userId: { id, userId } }, data: ... })` 用の compound unique index を貼るのが筋。
- 想定リスク: 単独では問題ないが、N 個のタスクを操作する API（無いが将来）で N+1 化する。
- コスト: **M**（schema 変更含む）
- 効果: **S**

### 8.6 `updateCategorySortOrder` / `reorderGroups` のトランザクション
- 場所: `actions/category.ts:267-271`, `actions/group.ts:163-165`
- 何が問題か: `prisma.$transaction(updates.map((u) => prisma.update({ ... })))` で N 回 UPDATE。N が大きいと往復回数が増える。`UPDATE ... FROM (VALUES (id, sortOrder), ...)` 形の raw SQL 1 本にできる。
- コスト: **M**
- 効果: **S**（並び替えはユーザ操作頻度低）

---

## 先にやるべき TOP 5

優先度は **コスト × 効果** と **他のリファクタの土台になるか** で決めた。

### TOP 1: 未使用ファイル・未使用 export を一斉削除（dead code 一掃）
- 対象: 項目 6.1 / 6.2 / 6.3 全部
- 理由:
  - 影響範囲が小さく、CLAUDE.md の「不要な抽象化を残さない」方針に沿う
  - 後続の TOP2/3 で「filter UI を共通化」「型を統合」する際、`filter-panel.tsx` や `search-column.tsx` のような幽霊実装を残したまま整理しようとするとどれが正かわからなくなる
  - 約 1,900 行が消えると filter-sidebar 重複の見通しが一気によくなる
- リスク: 低（import が無いことを文字列検索で確認済み。CI / typecheck で安全策）
- コスト: **S** / 効果: **L**

### TOP 2: フィルター UI（sidebar/bottom-sheet/search-column）の共通化
- 対象: 項目 1.1 / 2.1 / 3.1 / 4.4 / 4.5
- 理由:
  - リポジトリ最大の重複源（合計 1,500 行超）。1 行直すと 3 箇所修正の世界
  - sort パラメータ・viewMode の URL/state 取り扱いが食い違っており、TOP1 で `search-column.tsx` を削除した後にやるとシンプル
  - 共通フィルター hook（`useTaskListFilters` 的な）を作ると、TOP4（クエリの非効率）の集計も一元化しやすい
- 進め方:
  1. `useFilterParams()` hook（URL ↔ status/keyword/date/favorite/category）を抽出
  2. `useDebouncedKeyword()` hook を抽出
  3. `<FilterStatusChips />`, `<FilterDateNav />`, `<FilterFavoriteToggle />`, `<FilterCategoryTree />` を共通化
  4. desktop は accordion ラッパー、mobile は bottom sheet ラッパーで合成
- コスト: **L** / 効果: **L**

### TOP 3: 型の単一情報源化と `any` の排除
- 対象: 項目 3.1 / 3.2 / 3.3 / 3.4
- 理由:
  - CLAUDE.md 「`any` 禁止」「Zod スキーマから型を推論」を明文化しているのに 5 箇所違反
  - `StatusFilter` / `ViewMode` / `SortOrder` を Zod スキーマ起点に統一しないと、TOP2 の共通化で結局型定義の取り合いになる
- 進め方:
  - `getAllTasksSchema.shape.status` から推論した `StatusFilter` を `lib/validations/task.ts` で export
  - Prisma の `Prisma.TaskWhereInput` / `Prisma.TaskUpdateInput` で `any` を置換
  - `CATEGORY_COLORS` を削除して `COLOR_PRESETS` に一本化
- コスト: **S** / 効果: **M**

### TOP 4: ホーム画面で重複する `getAllTasks` 呼び出しを集約
- 対象: 項目 8.1（および 8.2/8.3 への布石）
- 理由:
  - 1 レンダーで 5〜6 並列クエリ。タスク件数増で実害が出る
  - TOP2 で filter UI を共通化したあと、件数集計も hook 1 本で受けられる構造になる
  - サーバ側に `getTaskCounts` を 1 つ追加して `{ total, byStatus, byCategory, byFavorite }` を返すと、件数取得用の `useAllTasks` × 4 が消える
- 進め方:
  - `getTaskCounts(filter)` action を追加（`groupBy` ベース）
  - 件数だけが欲しい呼び出しを置き換え、メインのリスト取得は 1 回だけ
- リスク: 中（楽観更新時にカウントも一緒に書き換える必要あり）
- コスト: **M** / 効果: **L**

### TOP 5: `useTaskMutations` の楽観更新ボイラープレートを集約 + 未使用 mutation hooks を削除
- 対象: 項目 1.4 / 6.1（`use-today-tasks.ts`）
- 理由:
  - TOP1 で `use-today-tasks.ts` を消したあと、現役の `useTaskMutations` の中も `cancel→snapshot→update→error rollback→settled invalidate` が 9 回繰り返されている
  - 共通 helper `createOptimisticMutation({ mutationFn, optimisticUpdate, ... })` を作るとロジックが半分以下になり、TOP4 で件数キャッシュを連動させる時にも同じ場所で対応できる
  - TOP4 で件数 cache が増えると、楽観更新がさらに散らかる前に骨格を整える必要がある
- コスト: **M** / 効果: **M**

---

## 補足メモ

- TOP1 → TOP3 → TOP2 → TOP5 → TOP4 の順がもっとも安全。TOP2 と TOP4 は規模が大きいので、それぞれ別 PR かつ feature flag なしで段階導入可能（純粋なリファクタリング）。
- 巨大ページ（`page.tsx`, `categories/page.tsx`, `settings/page.tsx`）の分割（項目 2.2 / 2.5）は TOP2 が落ち着いた段階で着手するとほどよい。
- 集計 SQL 化（項目 8.2 / 8.3）と DnD ページ共通化（項目 1.3）は中期改善として TOP リストの後に積むのが妥当。
