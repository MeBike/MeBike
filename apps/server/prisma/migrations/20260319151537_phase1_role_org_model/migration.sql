-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'BANNED');

-- CreateEnum
CREATE TYPE "TechnicianTeamAvailability" AS ENUM ('AVAILABLE', 'UNAVAILABLE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'TECHNICIAN';
ALTER TYPE "UserRole" ADD VALUE 'MANAGER';
ALTER TYPE "UserRole" ADD VALUE 'AGENCY';

-- CreateTable
CREATE TABLE "Agency" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "contact_phone" TEXT,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Agency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnicianTeam" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "station_id" UUID NOT NULL,
    "availability_status" "TechnicianTeamAvailability" NOT NULL DEFAULT 'AVAILABLE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "TechnicianTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserOrgAssignment" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "station_id" UUID,
    "agency_id" UUID,
    "technician_team_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "UserOrgAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_technician_teams_station" ON "TechnicianTeam"("station_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserOrgAssignment_user_id_key" ON "UserOrgAssignment"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_org_assignments_station" ON "UserOrgAssignment"("station_id");

-- CreateIndex
CREATE INDEX "idx_user_org_assignments_agency" ON "UserOrgAssignment"("agency_id");

-- CreateIndex
CREATE INDEX "idx_user_org_assignments_technician_team" ON "UserOrgAssignment"("technician_team_id");

-- AddForeignKey
ALTER TABLE "TechnicianTeam" ADD CONSTRAINT "TechnicianTeam_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOrgAssignment" ADD CONSTRAINT "UserOrgAssignment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOrgAssignment" ADD CONSTRAINT "UserOrgAssignment_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "Station"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOrgAssignment" ADD CONSTRAINT "UserOrgAssignment_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOrgAssignment" ADD CONSTRAINT "UserOrgAssignment_technician_team_id_fkey" FOREIGN KEY ("technician_team_id") REFERENCES "TechnicianTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;
