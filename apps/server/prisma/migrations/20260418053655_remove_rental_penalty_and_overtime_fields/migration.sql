/*
  Warnings:

  - You are about to drop the column `overtime_rate` on the `pricing_policies` table. All the data in the column will be lost.
  - You are about to drop the column `overtime_amount` on the `rental_billing_records` table. All the data in the column will be lost.
  - You are about to drop the `rental_penalties` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "rental_penalties" DROP CONSTRAINT "rental_penalties_rental_id_fkey";

-- DropForeignKey
ALTER TABLE "rental_penalties" DROP CONSTRAINT "rental_penalties_wallet_hold_id_fkey";

-- AlterTable
ALTER TABLE "pricing_policies" DROP COLUMN "overtime_rate";

-- AlterTable
ALTER TABLE "rental_billing_records" DROP COLUMN "overtime_amount";

-- DropTable
DROP TABLE "rental_penalties";

-- DropEnum
DROP TYPE "rental_penalty_type";
