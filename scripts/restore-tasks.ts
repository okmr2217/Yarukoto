import { config } from "dotenv";
config();

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const CATEGORIES = [
  {
    name: "Yarukoto",
    description: "okmr2217/yarukoto — 日毎TODOを管理するWebアプリ（Next.js + Prisma + Supabase）の開発・改善タスク",
    color: "#6366f1",
    sortOrder: 1,
  },
  {
    name: "Peak Log",
    description: "okmr2217/peak-log — ピーク体験を記録・振り返るログアプリ（Next.js + Better Auth + Supabase）の開発・改善タスク",
    color: "#f59e0b",
    sortOrder: 2,
  },
  {
    name: "ブログ",
    description: "okmr2217/paritto-dev-diary — 個人技術ブログの記事執筆・サイト改善タスク",
    color: "#10b981",
    sortOrder: 3,
  },
  {
    name: "振り返り",
    description: "okmr2217/furikaeri-mcp — 振り返りMCPサーバーの開発と、日々の振り返りワークフローの改善タスク",
    color: "#8b5cf6",
    sortOrder: 4,
  },
  {
    name: "プロ管",
    description: "開発プロダクト群のバージョン管理・リリース運用・横断的な管理方針に関するタスク",
    color: "#3b82f6",
    sortOrder: 5,
  },
  {
    name: "個人",
    description: "日常生活・買い物・手続きなど開発以外の個人的なタスク",
    color: "#ec4899",
    sortOrder: 6,
  },
  {
    name: "個人開発",
    description: "特定リポジトリに紐づかない個人開発全般の設計検討・技術調査・横断的な改善タスク",
    color: "#14b8a6",
    sortOrder: 7,
  },
  {
    name: "ユニフェイス",
    description: "株式会社ユニフェイスでの業務・研修関連タスク",
    color: "#f97316",
    sortOrder: 8,
  },
] as const;

const TASKS: { category: string; title: string; memo?: string }[] = [
  // Yarukoto
  { category: "Yarukoto", title: "カレンダーのUI改善", memo: "狭い表示領域対応、代替表示方法の検討" },
  { category: "Yarukoto", title: "タスク名クリックで編集", memo: "スマホでは編集画面に遷移する方式" },
  { category: "Yarukoto", title: "カテゴリフィルターを複数選択に" },
  { category: "Yarukoto", title: "カテゴリの自動推測", memo: "AI API必要" },
  { category: "Yarukoto", title: "予定日の配置・表示方法の相談" },
  { category: "Yarukoto", title: "ダークモードのアイコン" },
  // Peak Log
  { category: "Peak Log", title: "peaklog Fabを複数ページで表示", memo: "現状インデックスページのみ。他ページからも追加できるようにしたい" },
  { category: "Peak Log", title: "peaklog PCレイアウト対応" },
  { category: "Peak Log", title: "peaklog スプラッシュスクリーン", memo: "PWAのスプラッシュでアイコン背景が透過されていない。どんな画像を用意すればいいか確認" },
  { category: "Peak Log", title: "peaklog historyにactivityフィルタ追加", memo: "タイムライン実装後" },
  { category: "Peak Log", title: "peaklog 記録は軽くの方向性", memo: "導線検討" },
  { category: "Peak Log", title: "peaklog UIデザインを全体的にミニマルに" },
  { category: "Peak Log", title: "peaklog Logに位置情報を追加" },
  { category: "Peak Log", title: "peaklog タグ機能" },
  { category: "Peak Log", title: "peaklog タスクカードでメモをインライン表示" },
  { category: "Peak Log", title: "peaklog ログインページの改善" },
  // ブログ
  { category: "ブログ", title: "記事生成プロンプトの改善", memo: "画像埋め込み・コピー機能" },
  { category: "ブログ", title: "記事のサムネイル画像" },
  { category: "ブログ", title: "ブログにスクショのギャラリー" },
  // 振り返り
  { category: "振り返り", title: "furikaeri-mcp 全データ統合サマリ自動生成", memo: "ブログ公開用" },
  { category: "振り返り", title: "furikaeri-mcp 書き込み権限" },
  // プロ管
  { category: "プロ管", title: "バージョン管理とversioningの関係" },
  // 個人
  { category: "個人", title: "ツケカン復活" },
  { category: "個人", title: "chromeのデフォルトアカウント直す" },
  { category: "個人", title: "キッチンの照明" },
  // 個人開発
  { category: "個人開発", title: "プレイリスト作成スクリプト調整" },
  { category: "個人開発", title: "セッション管理の相談" },
];

async function main() {
  const email = process.env.RESTORE_USER_EMAIL;
  if (!email) throw new Error("RESTORE_USER_EMAIL is not set");

  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  console.log(`👤 User found: ${user.email} (${user.id})`);

  // カテゴリを upsert
  const categoryMap: Record<string, string> = {};
  for (const cat of CATEGORIES) {
    const result = await prisma.category.upsert({
      where: { userId_name: { userId: user.id, name: cat.name } },
      update: { description: cat.description },
      create: {
        userId: user.id,
        name: cat.name,
        description: cat.description,
        color: cat.color,
        sortOrder: cat.sortOrder,
      },
    });
    categoryMap[cat.name] = result.id;
    console.log(`  📁 Category upserted: ${cat.name}`);
  }

  // タスクを作成（タイトル重複はスキップ）
  const result = await prisma.task.createMany({
    data: TASKS.map((t, i) => ({
      userId: user.id,
      categoryId: categoryMap[t.category] ?? null,
      title: t.title,
      memo: t.memo ?? null,
      status: "PENDING" as const,
      displayOrder: (i + 1) * 1.0,
    })),
    skipDuplicates: true,
  });

  console.log(`\n✅ Restored ${result.count} tasks (${TASKS.length - result.count} skipped as duplicates)`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
