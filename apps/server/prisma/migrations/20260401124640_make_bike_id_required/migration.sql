/*
  Warnings:

  - Made the column `bike_id` on table `redistribution_request_items` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "redistribution_request_items" DROP CONSTRAINT "redistribution_request_items_bike_id_fkey";

-- AlterTable
ALTER TABLE "redistribution_request_items" ALTER COLUMN "bike_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "redistribution_request_items" ADD CONSTRAINT "redistribution_request_items_bike_id_fkey" FOREIGN KEY ("bike_id") REFERENCES "Bike"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
