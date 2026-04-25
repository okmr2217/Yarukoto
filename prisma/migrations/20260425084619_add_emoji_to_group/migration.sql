-- AlterTable
ALTER TABLE "groups" ADD COLUMN     "emoji" VARCHAR(8);

-- Seed emoji for known groups
UPDATE "groups" SET emoji = '🛠' WHERE name = '自作プロダクト';
UPDATE "groups" SET emoji = '💡' WHERE name = '開発横断';
UPDATE "groups" SET emoji = '🏠' WHERE name = '暮らし';
UPDATE "groups" SET emoji = '📚' WHERE name = 'インプット・人間関係';
