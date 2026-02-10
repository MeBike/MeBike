/*
  Warnings:

  - You are about to alter the column `price` on the `Subscription` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `BigInt`.

*/
-- AlterTable
ALTER TABLE "Subscription" ALTER COLUMN "price" SET DATA TYPE BIGINT;
