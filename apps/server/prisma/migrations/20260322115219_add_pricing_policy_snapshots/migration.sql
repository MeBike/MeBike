-- AlterTable
ALTER TABLE "Rental" ADD COLUMN     "pricing_policy_id" UUID;

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "pricing_policy_id" UUID;

-- CreateIndex
CREATE INDEX "idx_rentals_pricing_policy" ON "Rental"("pricing_policy_id");

-- CreateIndex
CREATE INDEX "idx_reservations_pricing_policy" ON "Reservation"("pricing_policy_id");

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_pricing_policy_id_fkey" FOREIGN KEY ("pricing_policy_id") REFERENCES "pricing_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_pricing_policy_id_fkey" FOREIGN KEY ("pricing_policy_id") REFERENCES "pricing_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
