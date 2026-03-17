/*
  Warnings:

  - A unique constraint covering the columns `[rental_id]` on the table `BikeSwapRequest` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "unique_pending_bike_swap_request" ON "BikeSwapRequest"("rental_id") WHERE status = 'PENDING';
