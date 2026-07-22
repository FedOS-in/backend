-- DropForeignKey
ALTER TABLE "federation_forms" DROP CONSTRAINT IF EXISTS "federation_forms_currency_id_fkey";
ALTER TABLE "federation_forms" DROP CONSTRAINT IF EXISTS "federation_forms_membership_period_id_fkey";

-- DropIndex
DROP INDEX IF EXISTS "federation_forms_currency_id_idx";
DROP INDEX IF EXISTS "federation_forms_membership_period_id_idx";

-- AlterTable
ALTER TABLE "federation_forms" DROP COLUMN IF EXISTS "subscription_amount";
ALTER TABLE "federation_forms" DROP COLUMN IF EXISTS "currency_id";
ALTER TABLE "federation_forms" DROP COLUMN IF EXISTS "membership_period_id";
ALTER TABLE "federation_forms" ADD COLUMN "membership_type_id" UUID;

-- CreateIndex
CREATE INDEX "federation_forms_membership_type_id_idx" ON "federation_forms"("membership_type_id");

-- AddForeignKey
ALTER TABLE "federation_forms" ADD CONSTRAINT "federation_forms_membership_type_id_fkey" FOREIGN KEY ("membership_type_id") REFERENCES "membership_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
