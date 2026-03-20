-- CreateEnum
CREATE TYPE "discount_type" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "coupon_status" AS ENUM ('ACTIVE', 'ASSIGNED', 'LOCKED', 'USED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "coupon_trigger_type" AS ENUM ('RIDING_DURATION', 'USAGE_FREQUENCY', 'CAMPAIGN', 'MEMBERSHIP_MILESTONE', 'MANUAL_GRANT');

-- CreateEnum
CREATE TYPE "incident_source" AS ENUM ('DURING_RENTAL', 'POST_RETURN', 'STAFF_INSPECTION');

-- CreateEnum
CREATE TYPE "incident_status" AS ENUM ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "incident_severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "assignment_status" AS ENUM ('ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "maintenance_result" AS ENUM ('REPAIRED_ON_SITE', 'MOVED_TO_MAINTENANCE', 'NO_ISSUE_FOUND', 'NOT_FOUND', 'IRREPARABLE');

-- CreateEnum
CREATE TYPE "payment_method" AS ENUM ('WALLET', 'STRIPE', 'INTERNAL_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "redistribution_status" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'IN_TRANSIT', 'PARTIALLY_COMPLETED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "confirmation_method" AS ENUM ('QR_CODE', 'MANUAL');

-- CreateEnum
CREATE TYPE "handover_status" AS ENUM ('PENDING', 'CONFIRMED', 'UNDER_STATION_CARE', 'UNDER_AGENCY_CARE', 'DISPUTED');

-- CreateEnum
CREATE TYPE "rental_penalty_type" AS ENUM ('LATE_RETURN', 'LOSS', 'DAMAGE', 'OTHER');

-- CreateTable
CREATE TABLE "coupon_rules" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "trigger_type" "coupon_trigger_type" NOT NULL,
    "min_riding_minutes" INTEGER,
    "min_completed_rentals" INTEGER,
    "discount_type" "discount_type" NOT NULL,
    "discount_value" DECIMAL(12,2) NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "priority" INTEGER NOT NULL DEFAULT 100,
    "active_from" TIMESTAMPTZ,
    "active_to" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "coupon_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" UUID NOT NULL,
    "coupon_rule_id" UUID,
    "code" TEXT NOT NULL,
    "discount_type" "discount_type" NOT NULL,
    "discount_value" DECIMAL(12,2) NOT NULL,
    "expires_at" TIMESTAMPTZ,
    "status" "coupon_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_coupons" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "coupon_id" UUID NOT NULL,
    "assigned_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used_at" TIMESTAMPTZ,
    "locked_at" TIMESTAMPTZ,
    "lock_expires_at" TIMESTAMPTZ,
    "locked_for_payment_id" UUID,
    "status" "coupon_status" NOT NULL DEFAULT 'ASSIGNED',

    CONSTRAINT "user_coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "environmental_impact_policies" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "average_speed_kmh" DECIMAL(6,2) NOT NULL,
    "co2_saved_per_km" DECIMAL(12,4) NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "active_from" TIMESTAMPTZ,
    "active_to" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "environmental_impact_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "environmental_impact_stats" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "rental_id" UUID NOT NULL,
    "policy_id" UUID NOT NULL,
    "estimated_distance_km" DECIMAL(8,2),
    "co2_saved" DECIMAL(12,4) NOT NULL,
    "policy_snapshot" JSONB NOT NULL,
    "calculated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "environmental_impact_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_reports" (
    "id" UUID NOT NULL,
    "reporter_user_id" UUID NOT NULL,
    "rental_id" UUID,
    "bike_id" UUID NOT NULL,
    "station_id" UUID,
    "source" "incident_source" NOT NULL,
    "incident_type" TEXT NOT NULL,
    "severity" "incident_severity" NOT NULL,
    "description" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "bike_locked" BOOLEAN NOT NULL DEFAULT false,
    "status" "incident_status" NOT NULL DEFAULT 'OPEN',
    "reported_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ,
    "closed_at" TIMESTAMPTZ,

    CONSTRAINT "incident_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_attachments" (
    "id" UUID NOT NULL,
    "incident_report_id" UUID NOT NULL,
    "file_url" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incident_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technician_assignments" (
    "id" UUID NOT NULL,
    "incident_report_id" UUID NOT NULL,
    "technician_team_id" UUID,
    "technician_user_id" UUID,
    "assigned_by_user_id" UUID,
    "assigned_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMPTZ,
    "started_at" TIMESTAMPTZ,
    "resolved_at" TIMESTAMPTZ,
    "status" "assignment_status" NOT NULL DEFAULT 'ASSIGNED',

    CONSTRAINT "technician_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bike_maintenance_logs" (
    "id" UUID NOT NULL,
    "bike_id" UUID NOT NULL,
    "incident_report_id" UUID,
    "technician_user_id" UUID,
    "result" "maintenance_result" NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bike_maintenance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "wallet_id" UUID,
    "rental_id" UUID,
    "reservation_id" UUID,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" "payment_method" NOT NULL,
    "status" "payment_status" NOT NULL DEFAULT 'PENDING',
    "paid_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_policies" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "base_rate" DECIMAL(12,2) NOT NULL,
    "billing_unit_minutes" INTEGER NOT NULL,
    "overtime_rate" DECIMAL(12,2),
    "reservation_fee" DECIMAL(12,2) NOT NULL DEFAULT 2000,
    "deposit_required" DECIMAL(12,2) NOT NULL DEFAULT 500000,
    "late_return_cutoff" TIME NOT NULL DEFAULT '23:00:00'::time without time zone,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "active_from" TIMESTAMPTZ,
    "active_to" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "pricing_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redistribution_requests" (
    "id" UUID NOT NULL,
    "requested_by_user_id" UUID NOT NULL,
    "approved_by_user_id" UUID,
    "source_station_id" UUID NOT NULL,
    "target_station_id" UUID,
    "target_agency_id" UUID,
    "reason" TEXT,
    "status" "redistribution_status" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "started_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "redistribution_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redistribution_request_items" (
    "id" UUID NOT NULL,
    "redistribution_request_id" UUID NOT NULL,
    "bike_id" UUID,
    "requested_quantity" INTEGER,
    "delivered_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "redistribution_request_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_confirmations" (
    "id" UUID NOT NULL,
    "rental_id" UUID NOT NULL,
    "station_id" UUID,
    "agency_id" UUID,
    "confirmed_by_user_id" UUID NOT NULL,
    "confirmation_method" "confirmation_method" NOT NULL DEFAULT 'QR_CODE',
    "handover_status" "handover_status" NOT NULL DEFAULT 'PENDING',
    "confirmed_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "return_confirmations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_billing_records" (
    "id" UUID NOT NULL,
    "rental_id" UUID NOT NULL,
    "pricing_policy_id" UUID NOT NULL,
    "total_duration_minutes" INTEGER NOT NULL,
    "estimated_distance_km" DECIMAL(8,2),
    "base_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "overtime_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "coupon_discount_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "subscription_discount_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deposit_forfeited" BOOLEAN NOT NULL DEFAULT false,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rental_billing_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_penalties" (
    "id" UUID NOT NULL,
    "rental_id" UUID NOT NULL,
    "wallet_hold_id" UUID,
    "penalty_type" "rental_penalty_type" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rental_penalties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "idx_coupons_rule" ON "coupons"("coupon_rule_id");

-- CreateIndex
CREATE INDEX "idx_user_coupons_user" ON "user_coupons"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_coupons_coupon" ON "user_coupons"("coupon_id");

-- CreateIndex
CREATE INDEX "idx_user_coupons_status" ON "user_coupons"("status");

-- CreateIndex
CREATE INDEX "idx_user_coupons_locked_for_payment" ON "user_coupons"("locked_for_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "environmental_impact_stats_rental_id_key" ON "environmental_impact_stats"("rental_id");

-- CreateIndex
CREATE INDEX "idx_environmental_impact_stats_user" ON "environmental_impact_stats"("user_id");

-- CreateIndex
CREATE INDEX "idx_environmental_impact_stats_policy" ON "environmental_impact_stats"("policy_id");

-- CreateIndex
CREATE INDEX "idx_incident_reports_reporter" ON "incident_reports"("reporter_user_id");

-- CreateIndex
CREATE INDEX "idx_incident_reports_rental" ON "incident_reports"("rental_id");

-- CreateIndex
CREATE INDEX "idx_incident_reports_bike_status" ON "incident_reports"("bike_id", "status");

-- CreateIndex
CREATE INDEX "idx_incident_reports_station" ON "incident_reports"("station_id");

-- CreateIndex
CREATE INDEX "idx_incident_attachments_report" ON "incident_attachments"("incident_report_id");

-- CreateIndex
CREATE INDEX "idx_technician_assignments_incident_report" ON "technician_assignments"("incident_report_id");

-- CreateIndex
CREATE INDEX "idx_technician_assignments_team" ON "technician_assignments"("technician_team_id");

-- CreateIndex
CREATE INDEX "idx_technician_assignments_user" ON "technician_assignments"("technician_user_id");

-- CreateIndex
CREATE INDEX "idx_technician_assignments_status" ON "technician_assignments"("status");

-- CreateIndex
CREATE INDEX "idx_bike_maintenance_logs_bike" ON "bike_maintenance_logs"("bike_id");

-- CreateIndex
CREATE INDEX "idx_bike_maintenance_logs_incident_report" ON "bike_maintenance_logs"("incident_report_id");

-- CreateIndex
CREATE INDEX "idx_bike_maintenance_logs_technician_user" ON "bike_maintenance_logs"("technician_user_id");

-- CreateIndex
CREATE INDEX "idx_payments_user" ON "payments"("user_id");

-- CreateIndex
CREATE INDEX "idx_payments_wallet" ON "payments"("wallet_id");

-- CreateIndex
CREATE INDEX "idx_payments_rental" ON "payments"("rental_id");

-- CreateIndex
CREATE INDEX "idx_payments_reservation" ON "payments"("reservation_id");

-- CreateIndex
CREATE INDEX "idx_payments_status_created_at" ON "payments"("status", "created_at");

-- CreateIndex
CREATE INDEX "idx_redistribution_requests_requested_by" ON "redistribution_requests"("requested_by_user_id");

-- CreateIndex
CREATE INDEX "idx_redistribution_requests_approved_by" ON "redistribution_requests"("approved_by_user_id");

-- CreateIndex
CREATE INDEX "idx_redistribution_requests_source_station" ON "redistribution_requests"("source_station_id");

-- CreateIndex
CREATE INDEX "idx_redistribution_requests_target_station" ON "redistribution_requests"("target_station_id");

-- CreateIndex
CREATE INDEX "idx_redistribution_requests_target_agency" ON "redistribution_requests"("target_agency_id");

-- CreateIndex
CREATE INDEX "idx_redistribution_requests_status" ON "redistribution_requests"("status");

-- CreateIndex
CREATE INDEX "idx_redistribution_request_items_request" ON "redistribution_request_items"("redistribution_request_id");

-- CreateIndex
CREATE INDEX "idx_redistribution_request_items_bike" ON "redistribution_request_items"("bike_id");

-- CreateIndex
CREATE UNIQUE INDEX "return_confirmations_rental_id_key" ON "return_confirmations"("rental_id");

-- CreateIndex
CREATE INDEX "idx_return_confirmations_station" ON "return_confirmations"("station_id");

-- CreateIndex
CREATE INDEX "idx_return_confirmations_agency" ON "return_confirmations"("agency_id");

-- CreateIndex
CREATE INDEX "idx_return_confirmations_confirmed_by_user" ON "return_confirmations"("confirmed_by_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "rental_billing_records_rental_id_key" ON "rental_billing_records"("rental_id");

-- CreateIndex
CREATE INDEX "idx_rental_billing_records_pricing_policy" ON "rental_billing_records"("pricing_policy_id");

-- CreateIndex
CREATE INDEX "idx_rental_penalties_rental" ON "rental_penalties"("rental_id");

-- CreateIndex
CREATE INDEX "idx_rental_penalties_wallet_hold" ON "rental_penalties"("wallet_hold_id");

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_coupon_rule_id_fkey" FOREIGN KEY ("coupon_rule_id") REFERENCES "coupon_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_coupons" ADD CONSTRAINT "user_coupons_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_coupons" ADD CONSTRAINT "user_coupons_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_coupons" ADD CONSTRAINT "user_coupons_locked_for_payment_id_fkey" FOREIGN KEY ("locked_for_payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "environmental_impact_stats" ADD CONSTRAINT "environmental_impact_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "environmental_impact_stats" ADD CONSTRAINT "environmental_impact_stats_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "Rental"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "environmental_impact_stats" ADD CONSTRAINT "environmental_impact_stats_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "environmental_impact_policies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_reports" ADD CONSTRAINT "incident_reports_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_reports" ADD CONSTRAINT "incident_reports_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "Rental"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_reports" ADD CONSTRAINT "incident_reports_bike_id_fkey" FOREIGN KEY ("bike_id") REFERENCES "Bike"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_reports" ADD CONSTRAINT "incident_reports_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "Station"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_attachments" ADD CONSTRAINT "incident_attachments_incident_report_id_fkey" FOREIGN KEY ("incident_report_id") REFERENCES "incident_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technician_assignments" ADD CONSTRAINT "technician_assignments_incident_report_id_fkey" FOREIGN KEY ("incident_report_id") REFERENCES "incident_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technician_assignments" ADD CONSTRAINT "technician_assignments_technician_team_id_fkey" FOREIGN KEY ("technician_team_id") REFERENCES "TechnicianTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technician_assignments" ADD CONSTRAINT "technician_assignments_technician_user_id_fkey" FOREIGN KEY ("technician_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technician_assignments" ADD CONSTRAINT "technician_assignments_assigned_by_user_id_fkey" FOREIGN KEY ("assigned_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bike_maintenance_logs" ADD CONSTRAINT "bike_maintenance_logs_bike_id_fkey" FOREIGN KEY ("bike_id") REFERENCES "Bike"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bike_maintenance_logs" ADD CONSTRAINT "bike_maintenance_logs_incident_report_id_fkey" FOREIGN KEY ("incident_report_id") REFERENCES "incident_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bike_maintenance_logs" ADD CONSTRAINT "bike_maintenance_logs_technician_user_id_fkey" FOREIGN KEY ("technician_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "Rental"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redistribution_requests" ADD CONSTRAINT "redistribution_requests_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redistribution_requests" ADD CONSTRAINT "redistribution_requests_approved_by_user_id_fkey" FOREIGN KEY ("approved_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redistribution_requests" ADD CONSTRAINT "redistribution_requests_source_station_id_fkey" FOREIGN KEY ("source_station_id") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redistribution_requests" ADD CONSTRAINT "redistribution_requests_target_station_id_fkey" FOREIGN KEY ("target_station_id") REFERENCES "Station"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redistribution_requests" ADD CONSTRAINT "redistribution_requests_target_agency_id_fkey" FOREIGN KEY ("target_agency_id") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redistribution_request_items" ADD CONSTRAINT "redistribution_request_items_redistribution_request_id_fkey" FOREIGN KEY ("redistribution_request_id") REFERENCES "redistribution_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redistribution_request_items" ADD CONSTRAINT "redistribution_request_items_bike_id_fkey" FOREIGN KEY ("bike_id") REFERENCES "Bike"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_confirmations" ADD CONSTRAINT "return_confirmations_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "Rental"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_confirmations" ADD CONSTRAINT "return_confirmations_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "Station"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_confirmations" ADD CONSTRAINT "return_confirmations_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_confirmations" ADD CONSTRAINT "return_confirmations_confirmed_by_user_id_fkey" FOREIGN KEY ("confirmed_by_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_billing_records" ADD CONSTRAINT "rental_billing_records_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "Rental"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_billing_records" ADD CONSTRAINT "rental_billing_records_pricing_policy_id_fkey" FOREIGN KEY ("pricing_policy_id") REFERENCES "pricing_policies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_penalties" ADD CONSTRAINT "rental_penalties_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "Rental"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_penalties" ADD CONSTRAINT "rental_penalties_wallet_hold_id_fkey" FOREIGN KEY ("wallet_hold_id") REFERENCES "wallet_holds"("id") ON DELETE SET NULL ON UPDATE CASCADE;
