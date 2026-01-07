-- Partial unique index for active reservations per user.
-- Prisma cannot express partial indexes; keep this in SQL migrations.
-- TODO(fixed-slot): If FIXED_SLOT reservations should coexist with normal holds, scope this to `bike_id IS NOT NULL`
-- to prevent bike-hoarding while allowing multiple unassigned fixed-slot reservations.
CREATE UNIQUE INDEX "idx_reservations_active_user"
  ON "Reservation" ("user_id")
  WHERE "status" IN ('PENDING', 'ACTIVE');
