ALTER TABLE "AgencyRequest"
ADD COLUMN "station_name" TEXT,
ADD COLUMN "station_address" TEXT,
ADD COLUMN "station_latitude" DECIMAL(10, 7),
ADD COLUMN "station_longitude" DECIMAL(10, 7),
ADD COLUMN "station_total_capacity" INTEGER,
ADD COLUMN "station_pickup_slot_limit" INTEGER,
ADD COLUMN "station_return_slot_limit" INTEGER;
