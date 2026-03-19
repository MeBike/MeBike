-- CreateEnum
CREATE TYPE "AgencyRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "AgencyRequest" (
    "id" UUID NOT NULL,
    "requester_user_id" UUID,
    "requester_email" TEXT NOT NULL,
    "requester_phone" TEXT,
    "agency_name" TEXT NOT NULL,
    "agency_address" TEXT,
    "agency_contact_phone" TEXT,
    "status" "AgencyRequestStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "reviewed_by_user_id" UUID,
    "reviewed_at" TIMESTAMPTZ,
    "approved_agency_id" UUID,
    "created_agency_user_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "AgencyRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_agency_requests_status" ON "AgencyRequest"("status");

-- CreateIndex
CREATE INDEX "idx_agency_requests_requester_user" ON "AgencyRequest"("requester_user_id");

-- CreateIndex
CREATE INDEX "idx_agency_requests_requester_email" ON "AgencyRequest"("requester_email");

-- AddForeignKey
ALTER TABLE "AgencyRequest" ADD CONSTRAINT "AgencyRequest_requester_user_id_fkey" FOREIGN KEY ("requester_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyRequest" ADD CONSTRAINT "AgencyRequest_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyRequest" ADD CONSTRAINT "AgencyRequest_approved_agency_id_fkey" FOREIGN KEY ("approved_agency_id") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyRequest" ADD CONSTRAINT "AgencyRequest_created_agency_user_id_fkey" FOREIGN KEY ("created_agency_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
