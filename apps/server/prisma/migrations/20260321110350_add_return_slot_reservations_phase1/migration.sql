/*
  Warnings:

  - A unique constraint covering the columns `[reservation_id]` on the table `Rental` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ReturnSlotStatus" AS ENUM ('ACTIVE', 'USED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "ReservationStatus" ADD VALUE 'FULFILLED';

-- DropIndex
DROP INDEX "idx_rentals_active_bike";

-- DropIndex
DROP INDEX "idx_rentals_active_user";

-- AlterEnum
ALTER TYPE "RentalStatus" RENAME TO "RentalStatus_old";

-- CreateEnum
CREATE TYPE "RentalStatus" AS ENUM ('RENTED', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Rental" ADD COLUMN     "reservation_id" UUID;

-- Cleanup legacy placeholder rentals
DELETE FROM "Rental"
WHERE "status" = 'RESERVED';

-- AlterTable
ALTER TABLE "Rental" ALTER COLUMN "status" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Rental"
ALTER COLUMN "status" TYPE "RentalStatus"
USING ("status"::text::"RentalStatus");

-- AlterTable
ALTER TABLE "Rental" ALTER COLUMN "status" SET DEFAULT 'RENTED';

-- DropEnum
DROP TYPE "RentalStatus_old";

-- CreateTable
CREATE TABLE "return_slot_reservations" (
    "id" UUID NOT NULL,
    "rental_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "station_id" UUID NOT NULL,
    "reserved_from" TIMESTAMPTZ NOT NULL,
    "status" "ReturnSlotStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "return_slot_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_return_slot_reservations_rental" ON "return_slot_reservations"("rental_id");

-- CreateIndex
CREATE INDEX "idx_return_slot_reservations_user" ON "return_slot_reservations"("user_id");

-- CreateIndex
CREATE INDEX "idx_return_slot_reservations_station" ON "return_slot_reservations"("station_id");

-- CreateIndex
CREATE INDEX "idx_return_slot_reservations_status" ON "return_slot_reservations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "idx_return_slot_reservations_active_rental"
ON "return_slot_reservations"("rental_id")
WHERE "status" = 'ACTIVE';

-- CreateIndex
CREATE UNIQUE INDEX "Rental_reservation_id_key" ON "Rental"("reservation_id");

-- CreateIndex
CREATE UNIQUE INDEX "idx_rentals_active_bike"
ON "Rental"("bike_id")
WHERE "status" = 'RENTED' AND "bike_id" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "idx_rentals_active_user"
ON "Rental"("user_id")
WHERE "status" = 'RENTED';

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_slot_reservations" ADD CONSTRAINT "return_slot_reservations_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "Rental"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_slot_reservations" ADD CONSTRAINT "return_slot_reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_slot_reservations" ADD CONSTRAINT "return_slot_reservations_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
