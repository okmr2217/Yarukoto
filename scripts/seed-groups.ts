import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DIRECT_URL or DATABASE_URL is not defined");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const USER_ID = "kykNQY7vkDEnrj6uK4p8xwSa0hP41arg";

const GROUPS = [
  { name: "仕事", color: "#3B82F6", sortOrder: 0 },
  { name: "プライベート", color: "#22C55E", sortOrder: 1 },
  { name: "学習", color: "#8B5CF6", sortOrder: 2 },
] as const;

async function main() {
  console.log(`🌱 Seeding groups for user: ${USER_ID}`);

  const user = await prisma.user.findUnique({ where: { id: USER_ID } });
  if (!user) {
    throw new Error(`User ${USER_ID} not found`);
  }
  console.log(`✅ Found user: ${user.email}`);

  for (const groupData of GROUPS) {
    const group = await prisma.group.upsert({
      where: { userId_name: { userId: USER_ID, name: groupData.name } },
      update: {},
      create: { name: groupData.name, color: groupData.color, sortOrder: groupData.sortOrder, userId: USER_ID },
    });
    console.log(`  ${group.name} (${group.id})`);
  }

  const groups = await prisma.group.findMany({
    where: { userId: USER_ID },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { categories: true } } },
  });

  console.log(`\n✅ Groups for user (${groups.length} total):`);
  for (const g of groups) {
    console.log(`  - ${g.name} (${g._count.categories} categories)`);
  }

  console.log("\n🎉 Done. Assign categories to groups in the UI at /categories.");
}

main()
  .catch((e) => {
    console.error("❌ Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
