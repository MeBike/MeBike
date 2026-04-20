/*
  Warnings:

  - You are about to drop the `push_tokens` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "push_tokens" DROP CONSTRAINT "push_tokens_user_id_fkey";

-- DropTable
DROP TABLE "push_tokens";

-- DropEnum
DROP TYPE "PushTokenPlatform";
