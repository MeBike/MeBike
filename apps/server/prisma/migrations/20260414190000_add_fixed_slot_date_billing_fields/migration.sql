ALTER TABLE "public"."FixedSlotDate"
ADD COLUMN "pricing_policy_id" UUID,
ADD COLUMN "subscription_id" UUID,
ADD COLUMN "prepaid" DECIMAL(12,2);

UPDATE "public"."FixedSlotDate" AS d
SET
  "pricing_policy_id" = t."pricing_policy_id",
  "subscription_id" = t."subscription_id",
  "prepaid" = t."prepaid"
FROM "public"."FixedSlotTemplate" AS t
WHERE t."id" = d."template_id";

CREATE INDEX "idx_fixed_slot_dates_pricing_policy" ON "public"."FixedSlotDate"("pricing_policy_id");
CREATE INDEX "idx_fixed_slot_dates_subscription" ON "public"."FixedSlotDate"("subscription_id");

ALTER TABLE "public"."FixedSlotDate"
ADD CONSTRAINT "FixedSlotDate_pricing_policy_id_fkey"
FOREIGN KEY ("pricing_policy_id") REFERENCES "public"."pricing_policies"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."FixedSlotDate"
ADD CONSTRAINT "FixedSlotDate_subscription_id_fkey"
FOREIGN KEY ("subscription_id") REFERENCES "public"."Subscription"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
