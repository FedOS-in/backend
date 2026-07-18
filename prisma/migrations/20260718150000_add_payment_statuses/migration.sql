-- CreateTable
CREATE TABLE "payment_statuses" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "payment_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_statuses_name_key" ON "payment_statuses"("name");

-- SeedPaymentStatuses
INSERT INTO "payment_statuses" ("id", "name")
VALUES
  (1, 'Payment Pending'),
  (2, 'Payment Done');

-- Keep serial sequence in sync after explicit IDs
SELECT setval(
  pg_get_serial_sequence('payment_statuses', 'id'),
  (SELECT MAX(id) FROM "payment_statuses")
);

-- AlterTable
ALTER TABLE "federation_users"
ADD COLUMN "payment_status" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "federation_users_payment_status_idx" ON "federation_users"("payment_status");

-- AddForeignKey
ALTER TABLE "federation_users"
ADD CONSTRAINT "federation_users_payment_status_fkey"
FOREIGN KEY ("payment_status") REFERENCES "payment_statuses"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
