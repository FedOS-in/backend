-- CreateEnum
CREATE TYPE "PaymentPeriod" AS ENUM ('PRE_APPROVAL', 'POST_APPROVAL');

-- AlterTable
ALTER TABLE "federation_forms"
ADD COLUMN "subscription_amount" DECIMAL(12, 2),
ADD COLUMN "payment_period" "PaymentPeriod";
