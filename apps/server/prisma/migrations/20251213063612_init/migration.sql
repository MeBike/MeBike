/*
  Warnings:

  - You are about to drop the `Bike` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FixedSlotDate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FixedSlotTemplate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Rating` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RatingReason` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RatingReasonLink` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Rental` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Reservation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Station` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Subscription` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Supplier` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Bike" DROP CONSTRAINT "Bike_stationId_fkey";

-- DropForeignKey
ALTER TABLE "Bike" DROP CONSTRAINT "Bike_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "FixedSlotDate" DROP CONSTRAINT "FixedSlotDate_template_id_fkey";

-- DropForeignKey
ALTER TABLE "FixedSlotTemplate" DROP CONSTRAINT "FixedSlotTemplate_station_id_fkey";

-- DropForeignKey
ALTER TABLE "FixedSlotTemplate" DROP CONSTRAINT "FixedSlotTemplate_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Rating" DROP CONSTRAINT "Rating_rental_id_fkey";

-- DropForeignKey
ALTER TABLE "Rating" DROP CONSTRAINT "Rating_user_id_fkey";

-- DropForeignKey
ALTER TABLE "RatingReasonLink" DROP CONSTRAINT "RatingReasonLink_rating_id_fkey";

-- DropForeignKey
ALTER TABLE "RatingReasonLink" DROP CONSTRAINT "RatingReasonLink_reason_id_fkey";

-- DropForeignKey
ALTER TABLE "Rental" DROP CONSTRAINT "Rental_bike_id_fkey";

-- DropForeignKey
ALTER TABLE "Rental" DROP CONSTRAINT "Rental_end_station_fkey";

-- DropForeignKey
ALTER TABLE "Rental" DROP CONSTRAINT "Rental_start_station_fkey";

-- DropForeignKey
ALTER TABLE "Rental" DROP CONSTRAINT "Rental_subscription_id_fkey";

-- DropForeignKey
ALTER TABLE "Rental" DROP CONSTRAINT "Rental_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Reservation" DROP CONSTRAINT "Reservation_bike_id_fkey";

-- DropForeignKey
ALTER TABLE "Reservation" DROP CONSTRAINT "Reservation_fixed_slot_template_id_fkey";

-- DropForeignKey
ALTER TABLE "Reservation" DROP CONSTRAINT "Reservation_station_id_fkey";

-- DropForeignKey
ALTER TABLE "Reservation" DROP CONSTRAINT "Reservation_subscription_id_fkey";

-- DropForeignKey
ALTER TABLE "Reservation" DROP CONSTRAINT "Reservation_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_user_id_fkey";

-- DropTable
DROP TABLE "Bike";

-- DropTable
DROP TABLE "FixedSlotDate";

-- DropTable
DROP TABLE "FixedSlotTemplate";

-- DropTable
DROP TABLE "Rating";

-- DropTable
DROP TABLE "RatingReason";

-- DropTable
DROP TABLE "RatingReasonLink";

-- DropTable
DROP TABLE "Rental";

-- DropTable
DROP TABLE "Reservation";

-- DropTable
DROP TABLE "Station";

-- DropTable
DROP TABLE "Subscription";

-- DropTable
DROP TABLE "Supplier";

-- DropTable
DROP TABLE "User";

-- DropEnum
DROP TYPE "AppliesToEnum";

-- DropEnum
DROP TYPE "BikeStatus";

-- DropEnum
DROP TYPE "FixedSlotStatus";

-- DropEnum
DROP TYPE "RatingReasonType";

-- DropEnum
DROP TYPE "RentalStatus";

-- DropEnum
DROP TYPE "ReservationOption";

-- DropEnum
DROP TYPE "ReservationStatus";

-- DropEnum
DROP TYPE "SubscriptionPackage";

-- DropEnum
DROP TYPE "SubscriptionStatus";

-- DropEnum
DROP TYPE "SupplierStatus";

-- DropEnum
DROP TYPE "UserRole";

-- DropEnum
DROP TYPE "UserVerifyStatus";
