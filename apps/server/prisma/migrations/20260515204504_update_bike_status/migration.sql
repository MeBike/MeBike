/*
  Warnings:

  - The values [REDISTRIBUTING] on the enum `BikeStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BikeStatus_new" AS ENUM ('AVAILABLE', 'BOOKED', 'BROKEN', 'RESERVED', 'PENDING_DISPATCH', 'TRANSPORTING', 'SWAPPING', 'LOST', 'DISABLED');
ALTER TABLE "Bike" ALTER COLUMN "status" TYPE "BikeStatus_new" USING ("status"::text::"BikeStatus_new");
ALTER TYPE "BikeStatus" RENAME TO "BikeStatus_old";
ALTER TYPE "BikeStatus_new" RENAME TO "BikeStatus";
DROP TYPE "public"."BikeStatus_old";
COMMIT;
