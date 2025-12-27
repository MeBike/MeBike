-- Idempotency guard for fixed-slot reservation generation.
-- Ensures we cannot create duplicate Reservation rows for the same template + slot start timestamp.
-- Prisma cannot express partial unique indexes; keep this in SQL migrations.
CREATE UNIQUE INDEX "uq_reservations_fixed_slot_template_start_time"
  ON "Reservation" ("fixed_slot_template_id", "start_time")
  WHERE "fixed_slot_template_id" IS NOT NULL;

