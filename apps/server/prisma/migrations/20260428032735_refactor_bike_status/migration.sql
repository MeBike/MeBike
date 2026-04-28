/*
  Warnings:

  - The values [MAINTAINED,UNAVAILABLE] on the enum `BikeStatus` will be removed. If these variants are still used in the database, this will fail.
  - Made the column `target_station_id` on table `redistribution_requests` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BikeStatus_new" AS ENUM ('AVAILABLE', 'BOOKED', 'BROKEN', 'RESERVED', 'REDISTRIBUTING', 'DISABLED');
ALTER TABLE "Bike" ALTER COLUMN "status" TYPE "BikeStatus_new" USING ("status"::text::"BikeStatus_new");
ALTER TYPE "BikeStatus" RENAME TO "BikeStatus_old";
ALTER TYPE "BikeStatus_new" RENAME TO "BikeStatus";
DROP TYPE "public"."BikeStatus_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "redistribution_requests" DROP CONSTRAINT "redistribution_requests_target_station_id_fkey";

-- AlterTable
ALTER TABLE "redistribution_requests" ALTER COLUMN "target_station_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "redistribution_requests" ADD CONSTRAINT "redistribution_requests_target_station_id_fkey" FOREIGN KEY ("target_station_id") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
