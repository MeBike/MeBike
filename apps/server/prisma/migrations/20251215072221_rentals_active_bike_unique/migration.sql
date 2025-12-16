-- AlterTable
ALTER TABLE "User" ALTER COLUMN "updated_at" DROP DEFAULT;
  CREATE UNIQUE INDEX "idx_rentals_active_bike"
  ON "Rental"("bike_id")
  WHERE "status" = 'RENTED' AND "bike_id" IS NOT NULL;
