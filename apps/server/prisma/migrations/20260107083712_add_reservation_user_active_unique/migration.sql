-- Partial unique index for active reservations per user.
-- Prisma cannot express partial indexes; keep this in SQL migrations.
CREATE UNIQUE INDEX "idx_reservations_active_user"
  ON "Reservation" ("user_id")
  WHERE "status" IN ('PENDING', 'ACTIVE');
