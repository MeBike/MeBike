/*
  Warnings:

  - Made the column `requested_quantity` on table `redistribution_requests` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "redistribution_requests" ALTER COLUMN "requested_quantity" SET NOT NULL;
