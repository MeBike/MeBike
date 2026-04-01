-- AlterTable
ALTER TABLE "technician_assignments" ADD COLUMN     "distance_meters" DOUBLE PRECISION,
ADD COLUMN     "duration_seconds" DOUBLE PRECISION,
ADD COLUMN     "route_geometry" TEXT;

-- CreateIndex
CREATE INDEX "idx_incident_reports_bike" ON "incident_reports"("bike_id");
