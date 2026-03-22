/*
  Warnings:

  - The values [app] on the enum `AppliesToEnum` will be removed. If these variants are still used in the database, this will fail.
  - The values [BANNED] on the enum `UserVerifyStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `Rating` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RatingReason` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RatingReasonLink` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AgencyRequest" DROP CONSTRAINT "AgencyRequest_created_agency_user_id_fkey";

-- DropForeignKey
ALTER TABLE "AgencyRequest" DROP CONSTRAINT "AgencyRequest_requester_user_id_fkey";

-- DropForeignKey
ALTER TABLE "AgencyRequest" DROP CONSTRAINT "AgencyRequest_reviewed_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "AuthEvent" DROP CONSTRAINT "AuthEvent_user_id_fkey";

-- DropForeignKey
ALTER TABLE "BikeSwapRequest" DROP CONSTRAINT "BikeSwapRequest_user_id_fkey";

-- DropForeignKey
ALTER TABLE "FixedSlotTemplate" DROP CONSTRAINT "FixedSlotTemplate_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Rating" DROP CONSTRAINT "Rating_rental_id_fkey";

-- DropForeignKey
ALTER TABLE "Rating" DROP CONSTRAINT "Rating_user_id_fkey";

-- DropForeignKey
ALTER TABLE "RatingReasonLink" DROP CONSTRAINT "RatingReasonLink_rating_id_fkey";

-- DropForeignKey
ALTER TABLE "RatingReasonLink" DROP CONSTRAINT "RatingReasonLink_reason_id_fkey";

-- DropForeignKey
ALTER TABLE "Rental" DROP CONSTRAINT "Rental_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Reservation" DROP CONSTRAINT "Reservation_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_user_id_fkey";

-- DropForeignKey
ALTER TABLE "UserOrgAssignment" DROP CONSTRAINT "UserOrgAssignment_user_id_fkey";

-- DropForeignKey
ALTER TABLE "bike_maintenance_logs" DROP CONSTRAINT "bike_maintenance_logs_technician_user_id_fkey";

-- DropForeignKey
ALTER TABLE "environmental_impact_stats" DROP CONSTRAINT "environmental_impact_stats_user_id_fkey";

-- DropForeignKey
ALTER TABLE "incident_reports" DROP CONSTRAINT "incident_reports_reporter_user_id_fkey";

-- DropForeignKey
ALTER TABLE "payment_attempts" DROP CONSTRAINT "payment_attempts_user_id_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_user_id_fkey";

-- DropForeignKey
ALTER TABLE "push_tokens" DROP CONSTRAINT "push_tokens_user_id_fkey";

-- DropForeignKey
ALTER TABLE "redistribution_requests" DROP CONSTRAINT "redistribution_requests_approved_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "redistribution_requests" DROP CONSTRAINT "redistribution_requests_requested_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "return_confirmations" DROP CONSTRAINT "return_confirmations_confirmed_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "technician_assignments" DROP CONSTRAINT "technician_assignments_assigned_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "technician_assignments" DROP CONSTRAINT "technician_assignments_technician_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_coupons" DROP CONSTRAINT "user_coupons_user_id_fkey";

-- DropForeignKey
ALTER TABLE "wallet_withdrawals" DROP CONSTRAINT "wallet_withdrawals_user_id_fkey";

-- DropForeignKey
ALTER TABLE "wallets" DROP CONSTRAINT "wallets_user_id_fkey";

-- DropTable
DROP TABLE "Rating";

-- DropTable
DROP TABLE "RatingReason";

-- DropTable
DROP TABLE "RatingReasonLink";

-- DropTable
DROP TABLE "User";

-- AlterEnum
BEGIN;
CREATE TYPE "AppliesToEnum_new" AS ENUM ('bike', 'station');
ALTER TYPE "AppliesToEnum" RENAME TO "AppliesToEnum_old";
ALTER TYPE "AppliesToEnum_new" RENAME TO "AppliesToEnum";
DROP TYPE "public"."AppliesToEnum_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "UserVerifyStatus_new" AS ENUM ('UNVERIFIED', 'VERIFIED');
ALTER TYPE "UserVerifyStatus" RENAME TO "UserVerifyStatus_old";
ALTER TYPE "UserVerifyStatus_new" RENAME TO "UserVerifyStatus";
DROP TYPE "public"."UserVerifyStatus_old";
COMMIT;

-- CreateTable
CREATE TABLE "rating_reasons" (
    "id" UUID NOT NULL,
    "type" "RatingReasonType" NOT NULL,
    "applies_to" "AppliesToEnum" NOT NULL,
    "message" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "rating_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ratings" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "rental_id" UUID NOT NULL,
    "bike_id" UUID,
    "station_id" UUID,
    "bike_score" INTEGER NOT NULL,
    "station_score" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "edited_at" TIMESTAMPTZ,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rating_reason_links" (
    "rating_id" UUID NOT NULL,
    "reason_id" UUID NOT NULL,
    "target" "AppliesToEnum" NOT NULL,

    CONSTRAINT "rating_reason_links_pkey" PRIMARY KEY ("rating_id","reason_id","target")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone_number" TEXT,
    "username" TEXT,
    "password_hash" TEXT NOT NULL,
    "avatar_url" TEXT,
    "location_text" TEXT,
    "nfc_card_uid" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "account_status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "verify_status" "UserVerifyStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "stripe_connected_account_id" TEXT,
    "stripe_payouts_enabled" BOOLEAN,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ratings_rental_id_key" ON "ratings"("rental_id");

-- CreateIndex
CREATE INDEX "idx_ratings_user" ON "ratings"("user_id");

-- CreateIndex
CREATE INDEX "idx_ratings_rental" ON "ratings"("rental_id");

-- CreateIndex
CREATE INDEX "idx_ratings_bike" ON "ratings"("bike_id");

-- CreateIndex
CREATE INDEX "idx_ratings_station" ON "ratings"("station_id");

-- CreateIndex
CREATE INDEX "idx_ratings_bike_score" ON "ratings"("bike_score");

-- CreateIndex
CREATE INDEX "idx_ratings_station_score" ON "ratings"("station_score");

-- CreateIndex
CREATE INDEX "idx_rating_reason_links_rating" ON "rating_reason_links"("rating_id");

-- CreateIndex
CREATE INDEX "idx_rating_reason_links_reason" ON "rating_reason_links"("reason_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "users_stripe_connected_account_id_key" ON "users"("stripe_connected_account_id");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_phone" ON "users"("phone_number");

-- CreateIndex
CREATE INDEX "idx_users_nfc" ON "users" USING BRIN ("nfc_card_uid");

-- AddForeignKey
ALTER TABLE "AgencyRequest" ADD CONSTRAINT "AgencyRequest_requester_user_id_fkey" FOREIGN KEY ("requester_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyRequest" ADD CONSTRAINT "AgencyRequest_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyRequest" ADD CONSTRAINT "AgencyRequest_created_agency_user_id_fkey" FOREIGN KEY ("created_agency_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthEvent" ADD CONSTRAINT "AuthEvent_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BikeSwapRequest" ADD CONSTRAINT "BikeSwapRequest_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_coupons" ADD CONSTRAINT "user_coupons_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "environmental_impact_stats" ADD CONSTRAINT "environmental_impact_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixedSlotTemplate" ADD CONSTRAINT "FixedSlotTemplate_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_reports" ADD CONSTRAINT "incident_reports_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technician_assignments" ADD CONSTRAINT "technician_assignments_technician_user_id_fkey" FOREIGN KEY ("technician_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technician_assignments" ADD CONSTRAINT "technician_assignments_assigned_by_user_id_fkey" FOREIGN KEY ("assigned_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bike_maintenance_logs" ADD CONSTRAINT "bike_maintenance_logs_technician_user_id_fkey" FOREIGN KEY ("technician_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "Rental"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating_reason_links" ADD CONSTRAINT "rating_reason_links_rating_id_fkey" FOREIGN KEY ("rating_id") REFERENCES "ratings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating_reason_links" ADD CONSTRAINT "rating_reason_links_reason_id_fkey" FOREIGN KEY ("reason_id") REFERENCES "rating_reasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redistribution_requests" ADD CONSTRAINT "redistribution_requests_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redistribution_requests" ADD CONSTRAINT "redistribution_requests_approved_by_user_id_fkey" FOREIGN KEY ("approved_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_confirmations" ADD CONSTRAINT "return_confirmations_confirmed_by_user_id_fkey" FOREIGN KEY ("confirmed_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOrgAssignment" ADD CONSTRAINT "UserOrgAssignment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_withdrawals" ADD CONSTRAINT "wallet_withdrawals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
