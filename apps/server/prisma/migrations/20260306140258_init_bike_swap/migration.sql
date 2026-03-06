/*
  Warnings:

  - You are about to drop the `GeoBoundary` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "BikeSwapStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED');

-- DropTable
DROP TABLE "GeoBoundary";

-- CreateTable
CREATE TABLE "BikeSwapRequest" (
    "id" UUID NOT NULL,
    "rental_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "old_bike_id" UUID NOT NULL,
    "new_bike_id" UUID,
    "reason" TEXT,
    "status" "BikeSwapStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "BikeSwapRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BikeSwapRequest" ADD CONSTRAINT "BikeSwapRequest_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BikeSwapRequest" ADD CONSTRAINT "BikeSwapRequest_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "Rental"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BikeSwapRequest" ADD CONSTRAINT "BikeSwapRequest_old_bike_id_fkey" FOREIGN KEY ("old_bike_id") REFERENCES "Bike"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BikeSwapRequest" ADD CONSTRAINT "BikeSwapRequest_new_bike_id_fkey" FOREIGN KEY ("new_bike_id") REFERENCES "Bike"("id") ON DELETE SET NULL ON UPDATE CASCADE;
