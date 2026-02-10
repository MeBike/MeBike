-- CreateEnum
CREATE TYPE "BikeStatus" AS ENUM ('AVAILABLE', 'BOOKED', 'BROKEN', 'RESERVED', 'MAINTAINED', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "FixedSlotStatus" AS ENUM ('ACTIVE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RatingReasonType" AS ENUM ('ISSUE', 'COMPLIMENT');

-- CreateEnum
CREATE TYPE "AppliesToEnum" AS ENUM ('bike', 'station', 'app');

-- CreateEnum
CREATE TYPE "RentalStatus" AS ENUM ('RENTED', 'COMPLETED', 'CANCELLED', 'RESERVED');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'ACTIVE', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ReservationOption" AS ENUM ('ONE_TIME', 'FIXED_SLOT', 'SUBSCRIPTION');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SubscriptionPackage" AS ENUM ('basic', 'premium', 'unlimited');

-- CreateEnum
CREATE TYPE "SupplierStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TERMINATED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'STAFF', 'ADMIN', 'SOS');

-- CreateEnum
CREATE TYPE "UserVerifyStatus" AS ENUM ('UNVERIFIED', 'VERIFIED', 'BANNED');

-- CreateTable
CREATE TABLE "Bike" (
    "id" UUID NOT NULL,
    "chip_id" TEXT NOT NULL,
    "stationId" UUID,
    "supplierId" UUID,
    "status" "BikeStatus" NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Bike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FixedSlotTemplate" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "station_id" UUID NOT NULL,
    "slot_start" TIME NOT NULL,
    "status" "FixedSlotStatus" NOT NULL DEFAULT 'ACTIVE',
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FixedSlotTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FixedSlotDate" (
    "id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "slot_date" DATE NOT NULL,

    CONSTRAINT "FixedSlotDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RatingReason" (
    "id" UUID NOT NULL,
    "type" "RatingReasonType" NOT NULL,
    "applies_to" "AppliesToEnum" NOT NULL,
    "messages" TEXT NOT NULL,

    CONSTRAINT "RatingReason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "rental_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RatingReasonLink" (
    "rating_id" UUID NOT NULL,
    "reason_id" UUID NOT NULL,

    CONSTRAINT "RatingReasonLink_pkey" PRIMARY KEY ("rating_id","reason_id")
);

-- CreateTable
CREATE TABLE "Rental" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "bike_id" UUID,
    "start_station" UUID NOT NULL,
    "end_station" UUID,
    "start_time" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_time" TIMESTAMPTZ,
    "duration" INTEGER,
    "total_price" DECIMAL(12,2),
    "subscription_id" UUID,
    "status" "RentalStatus" NOT NULL DEFAULT 'RENTED',
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rental_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "bike_id" UUID,
    "station_id" UUID NOT NULL,
    "reservation_option" "ReservationOption" NOT NULL,
    "fixed_slot_template_id" UUID,
    "subscription_id" UUID,
    "start_time" TIMESTAMPTZ NOT NULL,
    "end_time" TIMESTAMPTZ,
    "prepaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Station" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "position" geography(Point, 4326) NOT NULL,

    CONSTRAINT "Station_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "package_name" "SubscriptionPackage" NOT NULL,
    "maxUsages" INTEGER,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "activated_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ,
    "price" DECIMAL(12,2) NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone_number" TEXT,
    "contract_fee" DECIMAL(10,2),
    "status" "SupplierStatus" NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "fullname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone_number" TEXT,
    "username" TEXT,
    "password_hash" TEXT NOT NULL,
    "avatar" TEXT,
    "location" TEXT,
    "nfc_card_uid" TEXT,
    "email_verify_otp" TEXT,
    "email_verify_otp_expires" TIMESTAMPTZ,
    "forgot_password_otp" TEXT,
    "forgot_password_otp_expires" TIMESTAMPTZ,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "verify" "UserVerifyStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Bike_chip_id_key" ON "Bike"("chip_id");

-- CreateIndex
CREATE INDEX "idx_fixed_slot_user" ON "FixedSlotTemplate"("user_id");

-- CreateIndex
CREATE INDEX "idx_fixed_slot_station" ON "FixedSlotTemplate"("station_id");

-- CreateIndex
CREATE INDEX "idx_fixed_slot_status" ON "FixedSlotTemplate"("status");

-- CreateIndex
CREATE INDEX "idx_fixed_slot_dates_template" ON "FixedSlotDate"("template_id");

-- CreateIndex
CREATE INDEX "idx_fixed_slot_dates_date" ON "FixedSlotDate"("slot_date");

-- CreateIndex
CREATE UNIQUE INDEX "FixedSlotDate_template_id_slot_date_key" ON "FixedSlotDate"("template_id", "slot_date");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_rental_id_key" ON "Rating"("rental_id");

-- CreateIndex
CREATE INDEX "idx_ratings_user" ON "Rating"("user_id");

-- CreateIndex
CREATE INDEX "idx_ratings_rental" ON "Rating"("rental_id");

-- CreateIndex
CREATE INDEX "idx_ratings_rating" ON "Rating"("rating");

-- CreateIndex
CREATE INDEX "idx_rating_reason_links_rating" ON "RatingReasonLink"("rating_id");

-- CreateIndex
CREATE INDEX "idx_rating_reason_links_reason" ON "RatingReasonLink"("reason_id");

-- CreateIndex
CREATE INDEX "idx_rentals_user" ON "Rental"("user_id");

-- CreateIndex
CREATE INDEX "idx_rentals_bike" ON "Rental"("bike_id");

-- CreateIndex
CREATE INDEX "idx_rentals_status" ON "Rental"("status");

-- CreateIndex
CREATE INDEX "idx_rentals_start_time" ON "Rental"("start_time");

-- CreateIndex
CREATE INDEX "idx_rentals_start_station" ON "Rental"("start_station");

-- CreateIndex
CREATE INDEX "idx_rentals_user_active" ON "Rental"("user_id", "status");

-- CreateIndex
CREATE INDEX "idx_reservations_user" ON "Reservation"("user_id");

-- CreateIndex
CREATE INDEX "idx_reservations_bike" ON "Reservation"("bike_id");

-- CreateIndex
CREATE INDEX "idx_reservations_station" ON "Reservation"("station_id");

-- CreateIndex
CREATE INDEX "idx_reservations_status" ON "Reservation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Station_name_key" ON "Station"("name");

-- CreateIndex
CREATE INDEX "idx_subscriptions_user" ON "Subscription"("user_id");

-- CreateIndex
CREATE INDEX "idx_subscriptions_status" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "idx_subscriptions_expires" ON "Subscription"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_number_key" ON "User"("phone_number");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "User"("email");

-- CreateIndex
CREATE INDEX "idx_users_phone" ON "User"("phone_number");

-- CreateIndex
CREATE INDEX "idx_users_nfc" ON "User" USING BRIN ("nfc_card_uid");

-- AddForeignKey
ALTER TABLE "Bike" ADD CONSTRAINT "Bike_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bike" ADD CONSTRAINT "Bike_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixedSlotTemplate" ADD CONSTRAINT "FixedSlotTemplate_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixedSlotTemplate" ADD CONSTRAINT "FixedSlotTemplate_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixedSlotDate" ADD CONSTRAINT "FixedSlotDate_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "FixedSlotTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "Rental"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RatingReasonLink" ADD CONSTRAINT "RatingReasonLink_rating_id_fkey" FOREIGN KEY ("rating_id") REFERENCES "Rating"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RatingReasonLink" ADD CONSTRAINT "RatingReasonLink_reason_id_fkey" FOREIGN KEY ("reason_id") REFERENCES "RatingReason"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_bike_id_fkey" FOREIGN KEY ("bike_id") REFERENCES "Bike"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_start_station_fkey" FOREIGN KEY ("start_station") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_end_station_fkey" FOREIGN KEY ("end_station") REFERENCES "Station"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_bike_id_fkey" FOREIGN KEY ("bike_id") REFERENCES "Bike"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_fixed_slot_template_id_fkey" FOREIGN KEY ("fixed_slot_template_id") REFERENCES "FixedSlotTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
