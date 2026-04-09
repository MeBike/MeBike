-- Partial unique indexes for active subscription, rental, and reservation integrity.
-- Prisma cannot express these partial indexes; keep them in SQL migrations.

CREATE UNIQUE INDEX "idx_subscriptions_active_user"
ON "Subscription"("user_id")
WHERE status = 'ACTIVE';

CREATE UNIQUE INDEX "idx_rentals_active_user"
ON "Rental"("user_id")
WHERE "status" = 'RENTED';

CREATE UNIQUE INDEX "idx_reservations_active_bike"
  ON "Reservation" ("bike_id")
  WHERE "status" IN ('PENDING', 'ACTIVE') AND "bike_id" IS NOT NULL;

CREATE UNIQUE INDEX "uq_reservations_fixed_slot_template_start_time"
  ON "Reservation" ("fixed_slot_template_id", "start_time")
  WHERE "fixed_slot_template_id" IS NOT NULL;

CREATE UNIQUE INDEX "idx_reservations_active_user"
  ON "Reservation" ("user_id")
  WHERE "status" IN ('PENDING', 'ACTIVE');
