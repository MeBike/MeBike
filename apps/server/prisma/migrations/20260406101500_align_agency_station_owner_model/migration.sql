CREATE TYPE "station_type" AS ENUM ('INTERNAL', 'AGENCY');

ALTER TABLE "Station"
ADD COLUMN "station_type" "station_type" NOT NULL DEFAULT 'INTERNAL',
ADD COLUMN "agency_id" UUID;

ALTER TABLE "Station"
ADD CONSTRAINT "Station_agency_id_fkey"
FOREIGN KEY ("agency_id") REFERENCES "Agency"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

CREATE UNIQUE INDEX "Station_agency_id_key" ON "Station"("agency_id");

ALTER TABLE "Agency"
DROP COLUMN "address";

DROP INDEX IF EXISTS "idx_return_confirmations_agency";
ALTER TABLE "return_confirmations"
DROP CONSTRAINT IF EXISTS "return_confirmations_agency_id_fkey";
ALTER TABLE "return_confirmations"
DROP COLUMN "agency_id";

DROP INDEX IF EXISTS "idx_redistribution_requests_target_agency";
ALTER TABLE "redistribution_requests"
DROP CONSTRAINT IF EXISTS "redistribution_requests_target_agency_id_fkey";
ALTER TABLE "redistribution_requests"
DROP COLUMN "target_agency_id";
