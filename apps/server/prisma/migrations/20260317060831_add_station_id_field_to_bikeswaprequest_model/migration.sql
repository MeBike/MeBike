-- AlterTable
ALTER TABLE "BikeSwapRequest" ADD COLUMN     "station_id" UUID;

-- AddForeignKey
ALTER TABLE "BikeSwapRequest" ADD CONSTRAINT "BikeSwapRequest_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "Station"("id") ON DELETE SET NULL ON UPDATE CASCADE;
