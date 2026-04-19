ALTER TYPE "SubscriptionPackage" RENAME VALUE 'unlimited' TO 'ultra';

UPDATE "Subscription"
SET "maxUsages" = 90
WHERE "package_name" = 'ultra'
  AND "maxUsages" IS NULL;
