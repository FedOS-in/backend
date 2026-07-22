-- CreateTable
CREATE TABLE "validities" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "days" INTEGER NOT NULL,

    CONSTRAINT "validities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_types" (
    "id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "federation_node_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "currency_id" INTEGER NOT NULL,
    "validity_id" INTEGER NOT NULL,
    "joining_fee" DECIMAL(12,2) NOT NULL,
    "renewal_fee" DECIMAL(12,2) NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 1,
    "created_on" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membership_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "membership_types_federation_node_id_idx" ON "membership_types"("federation_node_id");

-- CreateIndex
CREATE INDEX "membership_types_currency_id_idx" ON "membership_types"("currency_id");

-- CreateIndex
CREATE INDEX "membership_types_validity_id_idx" ON "membership_types"("validity_id");

-- CreateIndex
CREATE UNIQUE INDEX "membership_types_federation_node_id_code_key" ON "membership_types"("federation_node_id", "code");

-- AddForeignKey
ALTER TABLE "membership_types" ADD CONSTRAINT "membership_types_federation_node_id_fkey" FOREIGN KEY ("federation_node_id") REFERENCES "federation_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_types" ADD CONSTRAINT "membership_types_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "currency_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_types" ADD CONSTRAINT "membership_types_validity_id_fkey" FOREIGN KEY ("validity_id") REFERENCES "validities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
