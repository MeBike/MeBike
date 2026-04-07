/*
  Warnings:

  - A unique constraint covering the columns `[bike_number]` on the table `Bike` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `bike_number` to the `Bike` table without a default value. This is not possible if the table is not empty.

*/
-- CreateSequence
CREATE SEQUENCE "bike_number_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- AlterTable
ALTER TABLE "Bike" ADD COLUMN     "bike_number" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Bike_bike_number_key" ON "Bike"("bike_number");
