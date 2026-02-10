CREATE UNIQUE INDEX "idx_rentals_active_user"
ON "Rental"("user_id")
WHERE "status" = 'RENTED';
