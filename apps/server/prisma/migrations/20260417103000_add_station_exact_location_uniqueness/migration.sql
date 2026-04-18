CREATE UNIQUE INDEX "uq_station_exact_location"
ON "Station"("address", "latitude", "longitude");
