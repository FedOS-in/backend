-- AlterTable
ALTER TABLE "validities" ALTER COLUMN "days" DROP NOT NULL;

-- SeedValidities
INSERT INTO "validities" ("id", "label", "days")
VALUES
  (1, '1 month', 30),
  (2, '3 months', 90),
  (3, '6 months', 180),
  (4, '9 months', 270),
  (5, '12 months', 365),
  (6, 'Lifetime', NULL);

SELECT setval(
  pg_get_serial_sequence('validities', 'id'),
  (SELECT MAX(id) FROM "validities")
);
