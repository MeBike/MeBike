/*
  Warnings:

  - You are about to drop the column `nfc_card_uid` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "idx_users_nfc";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "nfc_card_uid";
