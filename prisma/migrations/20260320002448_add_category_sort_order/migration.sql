-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Initialize sortOrder for existing categories (name ASC order per user)
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY "userId" ORDER BY "name" ASC
  ) - 1 AS rn
  FROM "categories"
)
UPDATE "categories" SET "sortOrder" = ranked.rn
FROM ranked WHERE "categories".id = ranked.id;
