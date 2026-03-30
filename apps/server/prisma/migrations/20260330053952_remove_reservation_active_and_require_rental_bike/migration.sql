/*
  Warnings:

  - The values [ACTIVE] on the enum `ReservationStatus` will be removed. If these variants are still used in the database, this will fail.
  - Made the column `bike_id` on table `Rental` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX IF EXISTS "idx_reservations_active_bike";

-- DropIndex
DROP INDEX IF EXISTS "idx_reservations_active_user";

-- AlterEnum
BEGIN;
CREATE TYPE "ReservationStatus_new" AS ENUM ('PENDING', 'FULFILLED', 'CANCELLED', 'EXPIRED');
ALTER TABLE "public"."Reservation" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Reservation" ALTER COLUMN "status" TYPE "ReservationStatus_new" USING ("status"::text::"ReservationStatus_new");
ALTER TYPE "ReservationStatus" RENAME TO "ReservationStatus_old";
ALTER TYPE "ReservationStatus_new" RENAME TO "ReservationStatus";
DROP TYPE "public"."ReservationStatus_old";
ALTER TABLE "Reservation" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "Rental" DROP CONSTRAINT "Rental_bike_id_fkey";

-- AlterTable
ALTER TABLE "Rental" ALTER COLUMN "bike_id" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "idx_reservations_active_bike" ON "Reservation"("bike_id") WHERE "status" = 'PENDING' AND "bike_id" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "idx_reservations_active_user" ON "Reservation"("user_id") WHERE "status" = 'PENDING';

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_bike_id_fkey" FOREIGN KEY ("bike_id") REFERENCES "Bike"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
