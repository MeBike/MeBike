DROP INDEX "idx_rentals_active_bike";

DROP INDEX "idx_rentals_active_user";

ALTER TYPE "RentalStatus" RENAME TO "RentalStatus_old";

CREATE TYPE "RentalStatus" AS ENUM ('RENTED', 'COMPLETED');

ALTER TABLE "Rental" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "Rental"
ALTER COLUMN "status" TYPE "RentalStatus"
USING (
  CASE
    WHEN "status"::text = 'CANCELLED' THEN 'COMPLETED'
    ELSE "status"::text
  END::"RentalStatus"
);

ALTER TABLE "Rental" ALTER COLUMN "status" SET DEFAULT 'RENTED';

DROP TYPE "RentalStatus_old";

CREATE UNIQUE INDEX "idx_rentals_active_bike"
ON "Rental"("bike_id")
WHERE "status" = 'RENTED' AND "bike_id" IS NOT NULL;

CREATE UNIQUE INDEX "idx_rentals_active_user"
ON "Rental"("user_id")
WHERE "status" = 'RENTED';
