-- CreateEnum
CREATE TYPE "FormFieldType" AS ENUM ('TEXT', 'NUMBER', 'DATE', 'SELECT', 'MULTI_SELECT', 'BOOLEAN', 'FILE', 'EMAIL', 'PHONE', 'TEXTAREA');

-- CreateTable
CREATE TABLE "federation_nodes" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "parent_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "federation_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "federation_forms" (
    "id" UUID NOT NULL,
    "federation_node_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "federation_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_fields" (
    "id" UUID NOT NULL,
    "form_id" UUID NOT NULL,
    "field_key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "field_type" "FormFieldType" NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "options" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "form_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_statuses" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "approval_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "federation_users" (
    "id" UUID NOT NULL,
    "federation_node_id" UUID NOT NULL,
    "form_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "address" TEXT,
    "approval_status" INTEGER NOT NULL DEFAULT 1,
    "dynamic_fields" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "federation_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "federation_nodes_parent_id_idx" ON "federation_nodes"("parent_id");

-- CreateIndex
CREATE INDEX "federation_forms_federation_node_id_idx" ON "federation_forms"("federation_node_id");

-- CreateIndex
CREATE UNIQUE INDEX "federation_forms_federation_node_id_name_version_key" ON "federation_forms"("federation_node_id", "name", "version");

-- CreateIndex
CREATE INDEX "form_fields_form_id_idx" ON "form_fields"("form_id");

-- CreateIndex
CREATE UNIQUE INDEX "form_fields_form_id_field_key_key" ON "form_fields"("form_id", "field_key");

-- CreateIndex
CREATE UNIQUE INDEX "approval_statuses_value_key" ON "approval_statuses"("value");

-- CreateIndex
CREATE INDEX "federation_users_federation_node_id_idx" ON "federation_users"("federation_node_id");

-- CreateIndex
CREATE INDEX "federation_users_form_id_idx" ON "federation_users"("form_id");

-- CreateIndex
CREATE INDEX "federation_users_email_idx" ON "federation_users"("email");

-- CreateIndex
CREATE INDEX "federation_users_phone_number_idx" ON "federation_users"("phone_number");

-- AddForeignKey
ALTER TABLE "federation_nodes" ADD CONSTRAINT "federation_nodes_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "federation_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "federation_forms" ADD CONSTRAINT "federation_forms_federation_node_id_fkey" FOREIGN KEY ("federation_node_id") REFERENCES "federation_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "federation_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "federation_users" ADD CONSTRAINT "federation_users_federation_node_id_fkey" FOREIGN KEY ("federation_node_id") REFERENCES "federation_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "federation_users" ADD CONSTRAINT "federation_users_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "federation_forms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "federation_users" ADD CONSTRAINT "federation_users_approval_status_fkey" FOREIGN KEY ("approval_status") REFERENCES "approval_statuses"("value") ON DELETE RESTRICT ON UPDATE CASCADE;
