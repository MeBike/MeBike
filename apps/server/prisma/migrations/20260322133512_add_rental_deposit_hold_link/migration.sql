/*
  Warnings:

  - A unique constraint covering the columns `[deposit_hold_id]` on the table `Rental` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Rental" ADD COLUMN     "deposit_hold_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "Rental_deposit_hold_id_key" ON "Rental"("deposit_hold_id");

-- CreateIndex
CREATE INDEX "idx_rentals_deposit_hold" ON "Rental"("deposit_hold_id");

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_deposit_hold_id_fkey" FOREIGN KEY ("deposit_hold_id") REFERENCES "wallet_holds"("id") ON DELETE SET NULL ON UPDATE CASCADE;
