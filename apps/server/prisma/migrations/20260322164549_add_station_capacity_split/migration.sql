/*
  Warnings:

  - You are about to drop the column `capacity` on the `Station` table. All the data in the column will be lost.
  - Added the required column `total_capacity` to the `Station` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Station" DROP COLUMN "capacity",
ADD COLUMN     "pickup_slot_limit" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "return_slot_limit" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_capacity" INTEGER NOT NULL;
