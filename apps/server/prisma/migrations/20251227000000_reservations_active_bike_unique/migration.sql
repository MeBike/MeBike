-- Partial unique index for active reservations per bike.
-- Prisma cannot express partial indexes; keep this in SQL migrations.
CREATE UNIQUE INDEX "idx_reservations_active_bike"
  ON "Reservation" ("bike_id")
  WHERE "status" IN ('PENDING', 'ACTIVE') AND "bike_id" IS NOT NULL;

