-- CreateTable
CREATE TABLE "currency_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "currency_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "currency_types_name_key" ON "currency_types"("name");

-- SeedCurrencyTypes
INSERT INTO "currency_types" ("id", "name")
VALUES
  (1, 'Rupee'),
  (2, 'Dollar'),
  (3, 'Euro');

SELECT setval(
  pg_get_serial_sequence('currency_types', 'id'),
  (SELECT MAX(id) FROM "currency_types")
);

-- CreateTable
CREATE TABLE "membership_periods" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "membership_periods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "membership_periods_name_key" ON "membership_periods"("name");

-- SeedMembershipPeriods
INSERT INTO "membership_periods" ("id", "name")
VALUES
  (1, 'Annual Member'),
  (2, 'Lifetime Member');

SELECT setval(
  pg_get_serial_sequence('membership_periods', 'id'),
  (SELECT MAX(id) FROM "membership_periods")
);

-- AlterTable
ALTER TABLE "federation_forms"
ADD COLUMN "currency_id" INTEGER,
ADD COLUMN "membership_period_id" INTEGER;

-- CreateIndex
CREATE INDEX "federation_forms_currency_id_idx" ON "federation_forms"("currency_id");

-- CreateIndex
CREATE INDEX "federation_forms_membership_period_id_idx" ON "federation_forms"("membership_period_id");

-- AddForeignKey
ALTER TABLE "federation_forms"
ADD CONSTRAINT "federation_forms_currency_id_fkey"
FOREIGN KEY ("currency_id") REFERENCES "currency_types"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "federation_forms"
ADD CONSTRAINT "federation_forms_membership_period_id_fkey"
FOREIGN KEY ("membership_period_id") REFERENCES "membership_periods"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
