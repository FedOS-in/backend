/*
  Warnings:

  - You are about to drop the column `is_deleted` on the `federation_nodes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "federation_nodes" DROP COLUMN "is_deleted",
ADD COLUMN     "is_delete" BOOLEAN NOT NULL DEFAULT false;
