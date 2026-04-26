import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const SAMPLE_EMAIL = (process.env.SEED_SAMPLE_EMAIL ?? "sample@example.com").toLowerCase();
const SAMPLE_PASSWORD = process.env.SEED_SAMPLE_PASSWORD ?? "password123";

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function getToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function getRelativeDate(daysFromToday: number): Date {
  const date = getToday();
  date.setDate(date.getDate() + daysFromToday);
  return date;
}

function getCompletedAt(scheduledAt: Date): Date {
  return new Date(scheduledAt.getFullYear(), scheduledAt.getMonth(), scheduledAt.getDate(), 12, 0, 0);
}

async function main() {
  console.log("🌱 Seeding sample data...");

  console.log("🧹 Cleaning up existing sample user data...");
  const existingSampleUser = await prisma.user.findUnique({ where: { email: SAMPLE_EMAIL } });
  if (existingSampleUser) {
    await prisma.task.deleteMany({ where: { userId: existingSampleUser.id } });
    await prisma.category.deleteMany({ where: { userId: existingSampleUser.id } });
    await prisma.group.deleteMany({ where: { userId: existingSampleUser.id } });
    await prisma.session.deleteMany({ where: { userId: existingSampleUser.id } });
    await prisma.account.deleteMany({ where: { userId: existingSampleUser.id } });
    await prisma.user.delete({ where: { id: existingSampleUser.id } });
  }

  console.log("👤 Creating sample user...");
  const hashedPassword = await hashPassword(SAMPLE_PASSWORD);
  const sampleUser = await prisma.user.create({
    data: {
      email: SAMPLE_EMAIL,
      name: "サンプルユーザー",
      emailVerified: true,
      accounts: {
        create: {
          accountId: SAMPLE_EMAIL,
          providerId: "credential",
          password: hashedPassword,
        },
      },
    },
  });
  console.log(`✅ Created user: ${sampleUser.email}`);

  console.log("📁 Creating groups...");
  const [workGroup, studyGroup, lifeGroup, healthGroup] = await Promise.all([
    prisma.group.create({ data: { name: "仕事", emoji: "💼", color: "#3B82F6", sortOrder: 0, userId: sampleUser.id } }),
    prisma.group.create({ data: { name: "学習", emoji: "📚", color: "#8B5CF6", sortOrder: 1, userId: sampleUser.id } }),
    prisma.group.create({ data: { name: "生活・家事", emoji: "🏠", color: "#22C55E", sortOrder: 2, userId: sampleUser.id } }),
    prisma.group.create({ data: { name: "健康", emoji: "💪", color: "#EF4444", sortOrder: 3, userId: sampleUser.id } }),
  ]);
  console.log("✅ Created 4 groups");

  console.log("🏷️ Creating categories...");
  const [projectCategory, adminCategory, readingCategory, learningCategory, shoppingCategory, cleaningCategory, exerciseCategory, nutritionCategory] =
    await Promise.all([
      prisma.category.create({ data: { name: "プロジェクト", color: "#3B82F6", sortOrder: 0, userId: sampleUser.id, groupId: workGroup.id } }),
      prisma.category.create({ data: { name: "事務・雑務", color: "#60A5FA", sortOrder: 1, userId: sampleUser.id, groupId: workGroup.id } }),
      prisma.category.create({ data: { name: "読書", color: "#8B5CF6", sortOrder: 0, userId: sampleUser.id, groupId: studyGroup.id } }),
      prisma.category.create({ data: { name: "オンライン学習", color: "#A78BFA", sortOrder: 1, userId: sampleUser.id, groupId: studyGroup.id } }),
      prisma.category.create({ data: { name: "買い物", color: "#F97316", sortOrder: 0, userId: sampleUser.id, groupId: lifeGroup.id } }),
      prisma.category.create({ data: { name: "掃除・片付け", color: "#22C55E", sortOrder: 1, userId: sampleUser.id, groupId: lifeGroup.id } }),
      prisma.category.create({ data: { name: "運動", color: "#EF4444", sortOrder: 0, userId: sampleUser.id, groupId: healthGroup.id } }),
      prisma.category.create({ data: { name: "食事・栄養", color: "#F59E0B", sortOrder: 1, userId: sampleUser.id, groupId: healthGroup.id } }),
    ]);
  console.log("✅ Created 8 categories");

  console.log("📝 Creating tasks...");
  const today = getToday();
  const now = new Date();
  let order = 1;

  // ===== 統計ウィンドウ外の過去タスク (-28〜-13日) =====
  // 9 COMPLETED + 3 SKIPPED = 12件
  await Promise.all([
    prisma.task.create({ data: { title: "四半期レビューの資料作成", status: "COMPLETED", priority: "HIGH", scheduledAt: getRelativeDate(-28), completedAt: getCompletedAt(getRelativeDate(-28)), userId: sampleUser.id, categoryId: projectCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "経費精算の提出", memo: "領収書を添付", status: "COMPLETED", priority: "MEDIUM", scheduledAt: getRelativeDate(-25), completedAt: getCompletedAt(getRelativeDate(-25)), userId: sampleUser.id, categoryId: adminCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "朝のランニング30分", status: "SKIPPED", priority: "MEDIUM", scheduledAt: getRelativeDate(-23), skippedAt: getCompletedAt(getRelativeDate(-23)), skipReason: "雨天のため", userId: sampleUser.id, categoryId: exerciseCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "コーヒー豆を補充する", status: "COMPLETED", priority: "LOW", scheduledAt: getRelativeDate(-22), completedAt: getCompletedAt(getRelativeDate(-22)), userId: sampleUser.id, categoryId: shoppingCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "「Clean Architecture」第3章を読む", status: "COMPLETED", priority: "MEDIUM", scheduledAt: getRelativeDate(-20), completedAt: getCompletedAt(getRelativeDate(-20)), userId: sampleUser.id, categoryId: readingCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "筋トレ（上半身）", status: "COMPLETED", priority: "HIGH", scheduledAt: getRelativeDate(-19), completedAt: getCompletedAt(getRelativeDate(-19)), userId: sampleUser.id, categoryId: exerciseCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "リリースノート作成", status: "SKIPPED", priority: "HIGH", scheduledAt: getRelativeDate(-18), skippedAt: getCompletedAt(getRelativeDate(-18)), skipReason: "リリースが延期になった", userId: sampleUser.id, categoryId: projectCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "浴室の掃除をする", status: "COMPLETED", priority: "MEDIUM", scheduledAt: getRelativeDate(-17), completedAt: getCompletedAt(getRelativeDate(-17)), userId: sampleUser.id, categoryId: cleaningCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "TypeScriptの型システムを復習する", status: "COMPLETED", priority: "MEDIUM", scheduledAt: getRelativeDate(-16), completedAt: getCompletedAt(getRelativeDate(-16)), userId: sampleUser.id, categoryId: learningCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "Slackの未読を整理する", status: "SKIPPED", priority: "LOW", scheduledAt: getRelativeDate(-15), skippedAt: getCompletedAt(getRelativeDate(-15)), userId: sampleUser.id, categoryId: adminCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "スプリント計画の更新", memo: "月曜のミーティング前に", status: "COMPLETED", priority: "MEDIUM", scheduledAt: getRelativeDate(-14), completedAt: getCompletedAt(getRelativeDate(-14)), userId: sampleUser.id, categoryId: projectCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "「達人プログラマー」第1章を読む", status: "COMPLETED", priority: "LOW", scheduledAt: getRelativeDate(-13), completedAt: getCompletedAt(getRelativeDate(-13)), userId: sampleUser.id, categoryId: readingCategory.id, displayOrder: order++ } }),
  ]);

  // ===== 統計ウィンドウ内の過去タスク (4/15〜4/26, -12〜-1日) =====
  // 31 COMPLETED + 7 SKIPPED = 38件（日次グラフに反映）
  await Promise.all([
    // -12 (4/15): 3 COMPLETED
    prisma.task.create({ data: { title: "仕様書のレビュー", memo: "Slackで共有", status: "COMPLETED", priority: "HIGH", scheduledAt: getRelativeDate(-12), completedAt: getCompletedAt(getRelativeDate(-12)), userId: sampleUser.id, categoryId: projectCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "請求書の確認", status: "COMPLETED", priority: "MEDIUM", scheduledAt: getRelativeDate(-12), completedAt: getCompletedAt(getRelativeDate(-12)), userId: sampleUser.id, categoryId: adminCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "ウォーキング", memo: "夕方30分", status: "COMPLETED", priority: "MEDIUM", scheduledAt: getRelativeDate(-12), completedAt: getCompletedAt(getRelativeDate(-12)), userId: sampleUser.id, categoryId: exerciseCategory.id, displayOrder: order++ } }),

    // -11 (4/16): 2 COMPLETED + 1 SKIPPED
    prisma.task.create({ data: { title: "「ゼロからのOS自作入門」を読む", status: "COMPLETED", priority: "MEDIUM", scheduledAt: getRelativeDate(-11), completedAt: getCompletedAt(getRelativeDate(-11)), userId: sampleUser.id, categoryId: readingCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "洗剤を補充する", status: "COMPLETED", priority: "LOW", scheduledAt: getRelativeDate(-11), completedAt: getCompletedAt(getRelativeDate(-11)), userId: sampleUser.id, categoryId: shoppingCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "筋トレ（下半身）", status: "SKIPPED", priority: "MEDIUM", scheduledAt: getRelativeDate(-11), skippedAt: getCompletedAt(getRelativeDate(-11)), skipReason: "疲れていたので翌日に回す", userId: sampleUser.id, categoryId: exerciseCategory.id, displayOrder: order++ } }),

    // -10 (4/17): 3 COMPLETED
    prisma.task.create({ data: { title: "Udemyの講座を1章進める", memo: "React中級コース", status: "COMPLETED", priority: "MEDIUM", scheduledAt: getRelativeDate(-10), completedAt: getCompletedAt(getRelativeDate(-10)), userId: sampleUser.id, categoryId: learningCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "PRのコードレビュー", status: "COMPLETED", priority: "HIGH", scheduledAt: getRelativeDate(-10), completedAt: getCompletedAt(getRelativeDate(-10)), userId: sampleUser.id, categoryId: projectCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "プロテインを補充する", status: "COMPLETED", priority: "LOW", scheduledAt: getRelativeDate(-10), completedAt: getCompletedAt(getRelativeDate(-10)), userId: sampleUser.id, categoryId: nutritionCategory.id, displayOrder: order++ } }),

    // -9 (4/18): 2 COMPLETED + 1 SKIPPED
    prisma.task.create({ data: { title: "週次レポートの作成", status: "COMPLETED", priority: "HIGH", scheduledAt: getRelativeDate(-9), completedAt: getCompletedAt(getRelativeDate(-9)), userId: sampleUser.id, categoryId: adminCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "冷蔵庫の中を確認する", status: "COMPLETED", priority: null, scheduledAt: getRelativeDate(-9), completedAt: getCompletedAt(getRelativeDate(-9)), userId: sampleUser.id, categoryId: cleaningCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "牛乳と卵を買う", memo: "帰りにスーパーへ", status: "SKIPPED", priority: "MEDIUM", scheduledAt: getRelativeDate(-9), skippedAt: getCompletedAt(getRelativeDate(-9)), userId: sampleUser.id, categoryId: shoppingCategory.id, displayOrder: order++ } }),

    // -8 (4/19): 3 COMPLETED
    prisma.task.create({ data: { title: "バグ修正：検索機能の不具合", status: "COMPLETED", priority: "HIGH", scheduledAt: getRelativeDate(-8), completedAt: getCompletedAt(getRelativeDate(-8)), userId: sampleUser.id, categoryId: projectCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "読んだ本のメモをまとめる", status: "COMPLETED", priority: "LOW", scheduledAt: getRelativeDate(-8), completedAt: getCompletedAt(getRelativeDate(-8)), userId: sampleUser.id, categoryId: readingCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "ストレッチ15分", status: "COMPLETED", priority: "MEDIUM", scheduledAt: getRelativeDate(-8), completedAt: getCompletedAt(getRelativeDate(-8)), userId: sampleUser.id, categoryId: exerciseCategory.id, displayOrder: order++ } }),

    // -7 (4/20): 2 COMPLETED + 1 SKIPPED
    prisma.task.create({ data: { title: "英語の単語を30個復習する", status: "COMPLETED", priority: "LOW", scheduledAt: getRelativeDate(-7), completedAt: getCompletedAt(getRelativeDate(-7)), userId: sampleUser.id, categoryId: learningCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "メールの返信", status: "COMPLETED", priority: "HIGH", scheduledAt: getRelativeDate(-7), completedAt: getCompletedAt(getRelativeDate(-7)), userId: sampleUser.id, categoryId: adminCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "タスクの優先度整理", status: "SKIPPED", priority: "MEDIUM", scheduledAt: getRelativeDate(-7), skippedAt: getCompletedAt(getRelativeDate(-7)), skipReason: "緊急対応が入った", userId: sampleUser.id, categoryId: projectCategory.id, displayOrder: order++ } }),

    // -6 (4/21): 3 COMPLETED
    prisma.task.create({ data: { title: "デプロイ確認", memo: "本番環境での動作確認", status: "COMPLETED", priority: "HIGH", scheduledAt: getRelativeDate(-6), completedAt: getCompletedAt(getRelativeDate(-6)), userId: sampleUser.id, categoryId: projectCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "誕生日プレゼントを探す", memo: "予算3000円", status: "COMPLETED", priority: "MEDIUM", scheduledAt: getRelativeDate(-6), completedAt: getCompletedAt(getRelativeDate(-6)), userId: sampleUser.id, categoryId: shoppingCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "机を片付ける", memo: "書類を整理", status: "COMPLETED", priority: null, scheduledAt: getRelativeDate(-6), completedAt: getCompletedAt(getRelativeDate(-6)), userId: sampleUser.id, categoryId: cleaningCategory.id, displayOrder: order++ } }),

    // -5 (4/22): 3 COMPLETED + 1 SKIPPED
    prisma.task.create({ data: { title: "会議室の予約", status: "COMPLETED", priority: "MEDIUM", scheduledAt: getRelativeDate(-5), completedAt: getCompletedAt(getRelativeDate(-5)), userId: sampleUser.id, categoryId: adminCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "キッチンを掃除する", status: "COMPLETED", priority: "MEDIUM", scheduledAt: getRelativeDate(-5), completedAt: getCompletedAt(getRelativeDate(-5)), userId: sampleUser.id, categoryId: cleaningCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "APIドキュメントの更新", status: "COMPLETED", priority: "LOW", scheduledAt: getRelativeDate(-5), completedAt: getCompletedAt(getRelativeDate(-5)), userId: sampleUser.id, categoryId: projectCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "朝のランニング30分", status: "SKIPPED", priority: "MEDIUM", scheduledAt: getRelativeDate(-5), skippedAt: getCompletedAt(getRelativeDate(-5)), skipReason: "体調が優れない", userId: sampleUser.id, categoryId: exerciseCategory.id, displayOrder: order++ } }),

    // -4 (4/23): 2 COMPLETED
    prisma.task.create({ data: { title: "「ハーミットの法則」を読む", status: "COMPLETED", priority: "MEDIUM", scheduledAt: getRelativeDate(-4), completedAt: getCompletedAt(getRelativeDate(-4)), userId: sampleUser.id, categoryId: readingCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "AtCoderで練習問題を解く", status: "COMPLETED", priority: null, scheduledAt: getRelativeDate(-4), completedAt: getCompletedAt(getRelativeDate(-4)), userId: sampleUser.id, categoryId: learningCategory.id, displayOrder: order++ } }),

    // -3 (4/24): 3 COMPLETED + 1 SKIPPED
    prisma.task.create({ data: { title: "コードレビューのコメント対応", status: "COMPLETED", priority: "HIGH", scheduledAt: getRelativeDate(-3), completedAt: getCompletedAt(getRelativeDate(-3)), userId: sampleUser.id, categoryId: projectCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "腹筋・腕立て伏せ", status: "COMPLETED", priority: "MEDIUM", scheduledAt: getRelativeDate(-3), completedAt: getCompletedAt(getRelativeDate(-3)), userId: sampleUser.id, categoryId: exerciseCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "文房具を買う", status: "COMPLETED", priority: null, scheduledAt: getRelativeDate(-3), completedAt: getCompletedAt(getRelativeDate(-3)), userId: sampleUser.id, categoryId: shoppingCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "Reactの新機能をキャッチアップ", status: "SKIPPED", priority: "MEDIUM", scheduledAt: getRelativeDate(-3), skippedAt: getCompletedAt(getRelativeDate(-3)), skipReason: "今日は時間が足りなかった", userId: sampleUser.id, categoryId: learningCategory.id, displayOrder: order++ } }),

    // -2 (4/25): 2 COMPLETED
    prisma.task.create({ data: { title: "勤怠の確認・修正", status: "COMPLETED", priority: "MEDIUM", scheduledAt: getRelativeDate(-2), completedAt: getCompletedAt(getRelativeDate(-2)), userId: sampleUser.id, categoryId: adminCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "洗濯物を畳む", status: "COMPLETED", priority: null, scheduledAt: getRelativeDate(-2), completedAt: getCompletedAt(getRelativeDate(-2)), userId: sampleUser.id, categoryId: cleaningCategory.id, displayOrder: order++ } }),

    // -1 (4/26): 3 COMPLETED + 2 SKIPPED
    prisma.task.create({ data: { title: "ミーティング資料の作成", status: "COMPLETED", priority: "MEDIUM", scheduledAt: getRelativeDate(-1), completedAt: getCompletedAt(getRelativeDate(-1)), userId: sampleUser.id, categoryId: projectCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "Reactの新機能をキャッチアップ", status: "COMPLETED", priority: "MEDIUM", scheduledAt: getRelativeDate(-1), completedAt: getCompletedAt(getRelativeDate(-1)), userId: sampleUser.id, categoryId: learningCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "筋トレ（上半身）", status: "COMPLETED", priority: "HIGH", scheduledAt: getRelativeDate(-1), completedAt: getCompletedAt(getRelativeDate(-1)), userId: sampleUser.id, categoryId: exerciseCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "新しいイヤホンを探す", memo: "予算5000円以内", status: "SKIPPED", priority: "LOW", scheduledAt: getRelativeDate(-1), skippedAt: getCompletedAt(getRelativeDate(-1)), skipReason: "今月は出費を控える", userId: sampleUser.id, categoryId: shoppingCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "週次レポートの作成", status: "SKIPPED", priority: "MEDIUM", scheduledAt: getRelativeDate(-1), skippedAt: getCompletedAt(getRelativeDate(-1)), userId: sampleUser.id, categoryId: adminCategory.id, displayOrder: order++ } }),
  ]);

  // ===== 過去・期限超過タスク（PENDING, -3〜-1日）=====
  // 5件
  await Promise.all([
    prisma.task.create({ data: { title: "仕様変更の確認", status: "PENDING", priority: "HIGH", scheduledAt: getRelativeDate(-3), userId: sampleUser.id, categoryId: projectCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "PRのレビュー依頼", memo: "締め切り注意", status: "PENDING", priority: "MEDIUM", scheduledAt: getRelativeDate(-2), userId: sampleUser.id, categoryId: projectCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "経費精算の提出", memo: "今月中に提出", status: "PENDING", priority: "HIGH", scheduledAt: getRelativeDate(-2), userId: sampleUser.id, categoryId: adminCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "薬を買う", status: "PENDING", priority: "HIGH", scheduledAt: getRelativeDate(-1), userId: sampleUser.id, categoryId: shoppingCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "朝のランニング30分", status: "PENDING", priority: "MEDIUM", scheduledAt: getRelativeDate(-1), userId: sampleUser.id, categoryId: exerciseCategory.id, displayOrder: order++ } }),
  ]);

  // ===== 今日のタスク（PENDING）=====
  // 10件
  await Promise.all([
    prisma.task.create({ data: { title: "コードレビュー対応", status: "PENDING", priority: "HIGH", isFavorite: true, scheduledAt: today, userId: sampleUser.id, categoryId: projectCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "デプロイ前チェックリストの確認", memo: "Slackで共有", status: "PENDING", priority: "HIGH", scheduledAt: today, userId: sampleUser.id, categoryId: projectCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "バグ修正：ログイン処理のエラー", status: "PENDING", priority: "HIGH", scheduledAt: today, userId: sampleUser.id, categoryId: projectCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "週次レポートの作成", status: "PENDING", priority: "MEDIUM", scheduledAt: today, userId: sampleUser.id, categoryId: adminCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "メールの返信", memo: "クライアントへの返信を優先", status: "PENDING", priority: "MEDIUM", isFavorite: true, scheduledAt: today, userId: sampleUser.id, categoryId: adminCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "牛乳と卵を買う", memo: "スーパーの帰りに", status: "PENDING", priority: "HIGH", scheduledAt: today, userId: sampleUser.id, categoryId: shoppingCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "洗剤を補充する", status: "PENDING", priority: "MEDIUM", scheduledAt: today, userId: sampleUser.id, categoryId: shoppingCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "朝のランニング30分", status: "PENDING", priority: "HIGH", scheduledAt: today, userId: sampleUser.id, categoryId: exerciseCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "ストレッチ15分", status: "PENDING", priority: "MEDIUM", scheduledAt: today, userId: sampleUser.id, categoryId: exerciseCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "水分補給を意識する", status: "PENDING", priority: null, scheduledAt: today, userId: sampleUser.id, categoryId: nutritionCategory.id, displayOrder: order++ } }),
  ]);

  // ===== 今日のタスク（COMPLETED）=====
  // 8件
  await Promise.all([
    prisma.task.create({ data: { title: "朝のスタンドアップ参加", status: "COMPLETED", priority: null, scheduledAt: today, completedAt: now, userId: sampleUser.id, categoryId: projectCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "昨日の作業ログを整理", status: "COMPLETED", priority: null, scheduledAt: today, completedAt: now, userId: sampleUser.id, categoryId: projectCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "Slackの未読を整理する", status: "COMPLETED", priority: null, scheduledAt: today, completedAt: now, userId: sampleUser.id, categoryId: adminCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "技術記事を3本読む", status: "COMPLETED", priority: "MEDIUM", scheduledAt: today, completedAt: now, userId: sampleUser.id, categoryId: readingCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "英語の単語を30個復習する", status: "COMPLETED", priority: "MEDIUM", scheduledAt: today, completedAt: now, userId: sampleUser.id, categoryId: learningCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "コーヒー豆を補充する", status: "COMPLETED", priority: null, scheduledAt: today, completedAt: now, userId: sampleUser.id, categoryId: shoppingCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "腹筋・腕立て伏せ", status: "COMPLETED", priority: "HIGH", scheduledAt: today, completedAt: now, userId: sampleUser.id, categoryId: exerciseCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "洗濯物を畳む", status: "COMPLETED", priority: "MEDIUM", scheduledAt: today, completedAt: now, userId: sampleUser.id, categoryId: cleaningCategory.id, displayOrder: order++ } }),
  ]);

  // ===== 今日のタスク（SKIPPED）=====
  // 3件
  await Promise.all([
    prisma.task.create({ data: { title: "新しいイヤホンを探す", memo: "予算5000円", status: "SKIPPED", priority: "LOW", scheduledAt: today, skippedAt: now, skipReason: "今月は出費を控える", userId: sampleUser.id, categoryId: shoppingCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "筋トレ（下半身）", status: "SKIPPED", priority: "MEDIUM", scheduledAt: today, skippedAt: now, skipReason: "疲れていたので明日に回す", userId: sampleUser.id, categoryId: exerciseCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "野菜を多めに摂る", status: "SKIPPED", priority: null, scheduledAt: today, skippedAt: now, userId: sampleUser.id, categoryId: nutritionCategory.id, displayOrder: order++ } }),
  ]);

  // ===== 未来のタスク（+1〜+14日）=====
  // 10件
  await Promise.all([
    prisma.task.create({ data: { title: "新機能の設計ドキュメント作成", memo: "チームレビュー前に完成させる", status: "PENDING", priority: "HIGH", isFavorite: true, scheduledAt: getRelativeDate(1), userId: sampleUser.id, categoryId: projectCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "プロテインを補充する", status: "PENDING", priority: "HIGH", scheduledAt: getRelativeDate(1), userId: sampleUser.id, categoryId: nutritionCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "「ソフトウェア設計のトレードオフ」を読む", status: "PENDING", priority: "MEDIUM", scheduledAt: getRelativeDate(2), userId: sampleUser.id, categoryId: readingCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "経費精算の提出", memo: "今月末締め切り", status: "PENDING", priority: "HIGH", scheduledAt: getRelativeDate(3), userId: sampleUser.id, categoryId: adminCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "キッチンの大掃除", status: "PENDING", priority: "MEDIUM", scheduledAt: getRelativeDate(3), userId: sampleUser.id, categoryId: cleaningCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "誕生日プレゼントを買う", memo: "予算3000円", status: "PENDING", priority: "MEDIUM", scheduledAt: getRelativeDate(4), userId: sampleUser.id, categoryId: shoppingCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "読んだ本のメモをまとめる", status: "PENDING", priority: null, scheduledAt: getRelativeDate(7), userId: sampleUser.id, categoryId: readingCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "不要な書類を整理する", status: "PENDING", priority: "LOW", scheduledAt: getRelativeDate(7), userId: sampleUser.id, categoryId: cleaningCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "TypeScriptの型システムを復習する", status: "PENDING", priority: "MEDIUM", scheduledAt: getRelativeDate(10), userId: sampleUser.id, categoryId: learningCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "AWS認定試験の申し込み", memo: "来月の試験に向けて", status: "PENDING", priority: "HIGH", scheduledAt: getRelativeDate(14), userId: sampleUser.id, categoryId: learningCategory.id, displayOrder: order++ } }),
  ]);

  // ===== 日付未定タスク（カテゴリあり）=====
  // 8件
  await Promise.all([
    prisma.task.create({ data: { title: "技術負債の洗い出し", status: "PENDING", priority: "MEDIUM", userId: sampleUser.id, categoryId: projectCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "テストカバレッジを改善する", memo: "目標80%以上", status: "PENDING", priority: "HIGH", isFavorite: true, userId: sampleUser.id, categoryId: projectCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "積読リストを整理する", status: "PENDING", priority: null, userId: sampleUser.id, categoryId: readingCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "個人ブログを書く", status: "PENDING", priority: "LOW", userId: sampleUser.id, categoryId: learningCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "ポートフォリオを更新する", memo: "最新プロジェクトを追加", status: "PENDING", priority: "MEDIUM", userId: sampleUser.id, categoryId: learningCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "クローゼットの整理", status: "PENDING", priority: "LOW", userId: sampleUser.id, categoryId: cleaningCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "本棚を整理する", status: "PENDING", priority: null, userId: sampleUser.id, categoryId: cleaningCategory.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "栄養バランスの見直し", memo: "食事記録アプリを試す", status: "PENDING", priority: "MEDIUM", userId: sampleUser.id, categoryId: nutritionCategory.id, displayOrder: order++ } }),
  ]);

  // ===== 日付未定タスク（カテゴリなし）=====
  // 5件
  await Promise.all([
    prisma.task.create({ data: { title: "引越し先の候補を調べる", status: "PENDING", priority: "MEDIUM", userId: sampleUser.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "確定申告の書類を準備する", memo: "税理士に相談", status: "PENDING", priority: "HIGH", userId: sampleUser.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "スマートフォンの機種変更を検討する", status: "PENDING", priority: null, userId: sampleUser.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "友人との旅行プランを立てる", memo: "来年の春を目標に", status: "PENDING", priority: "MEDIUM", userId: sampleUser.id, displayOrder: order++ } }),
    prisma.task.create({ data: { title: "クレジットカードのポイントを確認する", status: "PENDING", priority: null, userId: sampleUser.id, displayOrder: order++ } }),
  ]);

  const taskCount = order - 1;
  console.log(`✅ Created ${taskCount} tasks`);

  console.log("\n🎉 Sample seeding completed!");
  console.log("\n📋 Sample account:");
  console.log(`   Email:    ${SAMPLE_EMAIL}`);
  console.log(`   Password: ${SAMPLE_PASSWORD}`);
  console.log("\n📊 Data summary:");
  console.log("   Groups: 4 / Categories: 8");
  console.log(`   Tasks: ${taskCount}`);
  console.log("   ├─ 過去 completed: 40件（うち統計ウィンドウ内 4/15–4/26: 31件）");
  console.log("   ├─ 過去 skipped:   10件（うち統計ウィンドウ内:  7件）");
  console.log("   ├─ 期限超過 pending: 5件");
  console.log("   ├─ 今日 pending:    10件");
  console.log("   ├─ 今日 completed:   8件");
  console.log("   ├─ 今日 skipped:     3件");
  console.log("   ├─ 未来:            10件");
  console.log("   └─ 日付未定:        13件");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
