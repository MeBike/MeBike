-- This is an empty migration.
CREATE UNIQUE INDEX "idx_subscriptions_active_user"
ON "Subscription"("user_id")
