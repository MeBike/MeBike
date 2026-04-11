/*
  Warnings:

  - You are about to drop the column `requested_quantity` on the `redistribution_request_items` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "redistribution_request_items" DROP COLUMN "requested_quantity";

-- AlterTable
ALTER TABLE "redistribution_requests" ADD COLUMN     "requested_quantity" INTEGER;
