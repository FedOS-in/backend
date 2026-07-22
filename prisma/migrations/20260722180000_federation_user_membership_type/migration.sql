-- AlterTable
ALTER TABLE "federation_users" ADD COLUMN IF NOT EXISTS "member_id" TEXT;
ALTER TABLE "federation_users" ADD COLUMN IF NOT EXISTS "membership_type_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "federation_users_member_id_key" ON "federation_users"("member_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "federation_users_membership_type_id_idx" ON "federation_users"("membership_type_id");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'federation_users_membership_type_id_fkey'
  ) THEN
    ALTER TABLE "federation_users"
      ADD CONSTRAINT "federation_users_membership_type_id_fkey"
      FOREIGN KEY ("membership_type_id") REFERENCES "membership_types"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
