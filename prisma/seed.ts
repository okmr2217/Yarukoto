import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import * as readline from "readline";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function maskConnectionString(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.password = "***";
    return parsed.toString();
  } catch {
    return url.replace(/:\/\/[^@]+@/, "://***@");
  }
}

function isLikelyProduction(url: string): boolean {
  const lower = url.toLowerCase();
  return /prod|production|live|release/.test(lower) || !lower.includes("localhost") && !lower.includes("127.0.0.1");
}

async function confirmDeletion(): Promise<void> {
  const masked = maskConnectionString(connectionString!);
  const looksLikeProd = isLikelyProduction(connectionString!);

  console.log("\n⚠️  全データ削除の確認");
  console.log(`   接続先: ${masked}`);

  if (looksLikeProd) {
    console.log("   ⚠️  本番 DB の可能性があります！");
  }

  console.log("\n   この操作はすべてのタスク・カテゴリ・グループ・ユーザーを削除します。");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  return new Promise((resolve, reject) => {
    rl.question('\n   続行するには "yes" と入力してください: ', (answer) => {
      rl.close();
      if (answer.trim().toLowerCase() === "yes") {
        resolve();
      } else {
        reject(new Error("シード処理をキャンセルしました"));
      }
    });
  });
}

// Get today's date in YYYY-MM-DD format
function getToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// Get date relative to today
function getRelativeDate(daysFromToday: number): Date {
  const date = getToday();
  date.setDate(date.getDate() + daysFromToday);
  return date;
}

async function main() {
  console.log("🌱 Seeding database...");

  await confirmDeletion();

  // Clean up existing data (optional - comment out if you want to keep existing data)
  console.log("🧹 Cleaning up existing data...");
  await prisma.task.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.group.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.user.deleteMany({});

  // Create test user
  console.log("👤 Creating test user...");
  const hashedPassword = await hashPassword("password123");

  const testUser = await prisma.user.create({
    data: {
      email: "test@example.com",
      name: "テストユーザー",
      emailVerified: true,
      accounts: {
        create: {
          accountId: "test@example.com",
          providerId: "credential",
          password: hashedPassword,
        },
      },
    },
  });

  console.log(`✅ Created user: ${testUser.email}`);

  // Create groups
  console.log("📁 Creating groups...");
  const groups = await Promise.all([
    prisma.group.create({
      data: {
        name: "仕事",
        emoji: "💼",
        color: "#3B82F6",
        sortOrder: 0,
        userId: testUser.id,
      },
    }),
    prisma.group.create({
      data: {
        name: "生活",
        emoji: "🏠",
        color: "#22C55E",
        sortOrder: 1,
        userId: testUser.id,
      },
    }),
  ]);

  const [workGroup, lifeGroup] = groups;
  console.log(`✅ Created ${groups.length} groups`);

  // Create categories
  console.log("🏷️ Creating categories...");
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: "仕事",
        color: "#3B82F6",
        sortOrder: 0,
        userId: testUser.id,
        groupId: workGroup.id,
      },
    }),
    prisma.category.create({
      data: {
        name: "プライベート",
        color: "#22C55E",
        sortOrder: 0,
        userId: testUser.id,
        groupId: lifeGroup.id,
      },
    }),
    prisma.category.create({
      data: {
        name: "買い物",
        color: "#F97316",
        sortOrder: 1,
        userId: testUser.id,
        groupId: lifeGroup.id,
      },
    }),
  ]);

  const [workCategory, privateCategory, shoppingCategory] = categories;
  console.log(`✅ Created ${categories.length} categories`);

  // Create tasks
  console.log("📝 Creating tasks...");
  const today = getToday();
  const now = new Date();

  const tasks = await Promise.all([
    // 期限超過タスク (overdue)
    prisma.task.create({
      data: {
        title: "週次レポートを作成する",
        memo: "金曜日までに提出",
        status: "PENDING",
        priority: "HIGH",
        scheduledAt: getRelativeDate(-2),
        userId: testUser.id,
        categoryId: workCategory.id,
        displayOrder: 1,
      },
    }),
    prisma.task.create({
      data: {
        title: "図書館で本を返却する",
        memo: "返却期限に注意",
        status: "PENDING",
        priority: "MEDIUM",
        scheduledAt: getRelativeDate(-1),
        userId: testUser.id,
        categoryId: privateCategory.id,
        displayOrder: 2,
      },
    }),

    // 今日のタスク (today)
    prisma.task.create({
      data: {
        title: "チームミーティングの議事録をまとめる",
        status: "PENDING",
        priority: "MEDIUM",
        scheduledAt: today,
        userId: testUser.id,
        categoryId: workCategory.id,
        displayOrder: 3,
      },
    }),
    prisma.task.create({
      data: {
        title: "牛乳と卵を買う",
        memo: "帰りにスーパーへ",
        status: "PENDING",
        priority: "HIGH",
        scheduledAt: today,
        userId: testUser.id,
        categoryId: shoppingCategory.id,
        displayOrder: 4,
      },
    }),
    prisma.task.create({
      data: {
        title: "歯医者の予約を取る",
        memo: "午後希望",
        status: "PENDING",
        priority: "HIGH",
        scheduledAt: today,
        userId: testUser.id,
        categoryId: privateCategory.id,
        displayOrder: 5,
      },
    }),
    prisma.task.create({
      data: {
        title: "プロジェクト進捗を確認する",
        memo: "Slackで共有",
        status: "PENDING",
        priority: "MEDIUM",
        scheduledAt: today,
        userId: testUser.id,
        categoryId: workCategory.id,
        displayOrder: 6,
      },
    }),

    // 日付未定タスク (undated)
    prisma.task.create({
      data: {
        title: "英語の勉強を再開する",
        memo: "Duolingoアプリ",
        status: "PENDING",
        userId: testUser.id,
        displayOrder: 7,
      },
    }),
    prisma.task.create({
      data: {
        title: "写真のバックアップを取る",
        status: "PENDING",
        userId: testUser.id,
        displayOrder: 8,
      },
    }),
    prisma.task.create({
      data: {
        title: "不要な服を整理する",
        status: "PENDING",
        priority: "LOW",
        userId: testUser.id,
        categoryId: privateCategory.id,
        displayOrder: 9,
      },
    }),

    // 今日完了したタスク (completed today)
    prisma.task.create({
      data: {
        title: "朝のジョギング",
        status: "COMPLETED",
        scheduledAt: today,
        completedAt: now,
        userId: testUser.id,
        categoryId: privateCategory.id,
        displayOrder: 10,
      },
    }),
    prisma.task.create({
      data: {
        title: "メールの返信をする",
        status: "COMPLETED",
        priority: "HIGH",
        scheduledAt: today,
        completedAt: now,
        userId: testUser.id,
        categoryId: workCategory.id,
        displayOrder: 11,
      },
    }),
    prisma.task.create({
      data: {
        title: "シャンプーを補充する",
        status: "COMPLETED",
        priority: "MEDIUM",
        scheduledAt: today,
        completedAt: now,
        userId: testUser.id,
        categoryId: shoppingCategory.id,
        displayOrder: 12,
      },
    }),

    // 今日やらないにしたタスク (skipped today)
    prisma.task.create({
      data: {
        title: "新しいイヤホンを探す",
        memo: "予算5000円以内",
        status: "SKIPPED",
        priority: "LOW",
        scheduledAt: today,
        skippedAt: now,
        skipReason: "今月は出費を控える",
        userId: testUser.id,
        categoryId: shoppingCategory.id,
        displayOrder: 13,
      },
    }),

    // 未来のタスク (future)
    prisma.task.create({
      data: {
        title: "友達の誕生日プレゼントを買う",
        status: "PENDING",
        priority: "MEDIUM",
        scheduledAt: getRelativeDate(3),
        userId: testUser.id,
        categoryId: shoppingCategory.id,
        displayOrder: 14,
      },
    }),
    prisma.task.create({
      data: {
        title: "経費精算を提出する",
        memo: "領収書を添付",
        status: "PENDING",
        priority: "LOW",
        scheduledAt: getRelativeDate(5),
        userId: testUser.id,
        categoryId: workCategory.id,
        displayOrder: 15,
      },
    }),
    prisma.task.create({
      data: {
        title: "部屋の掃除をする",
        status: "PENDING",
        priority: "LOW",
        scheduledAt: getRelativeDate(7),
        userId: testUser.id,
        categoryId: privateCategory.id,
        displayOrder: 16,
      },
    }),
  ]);

  console.log(`✅ Created ${tasks.length} tasks`);

  console.log("\n🎉 Seeding completed!");
  console.log("\n📋 Test account:");
  console.log("   Email: test@example.com");
  console.log("   Password: password123");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
