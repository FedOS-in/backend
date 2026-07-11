ALTER TABLE "federation_users"
  ADD COLUMN "address_line_1" TEXT,
  ADD COLUMN "address_line_2" TEXT,
  ADD COLUMN "city" TEXT,
  ADD COLUMN "state" TEXT,
  ADD COLUMN "pincode" TEXT,
  ADD COLUMN "password_hash" TEXT;

UPDATE "federation_users"
SET
  "address_line_1" = COALESCE("address", ''),
  "city" = '',
  "state" = '',
  "pincode" = '',
  "password_hash" = ''
WHERE
  "address_line_1" IS NULL
  OR "city" IS NULL
  OR "state" IS NULL
  OR "pincode" IS NULL
  OR "password_hash" IS NULL;

ALTER TABLE "federation_users"
  ALTER COLUMN "address_line_1" SET NOT NULL,
  ALTER COLUMN "city" SET NOT NULL,
  ALTER COLUMN "state" SET NOT NULL,
  ALTER COLUMN "pincode" SET NOT NULL,
  ALTER COLUMN "password_hash" SET NOT NULL;

ALTER TABLE "federation_users"
  DROP COLUMN "address";
