ALTER TABLE "public"."FixedSlotDate"
DROP CONSTRAINT "FixedSlotDate_pricing_policy_id_fkey",
DROP CONSTRAINT "FixedSlotDate_subscription_id_fkey";

DROP INDEX "public"."idx_fixed_slot_dates_pricing_policy";
DROP INDEX "public"."idx_fixed_slot_dates_subscription";

ALTER TABLE "public"."FixedSlotDate"
DROP COLUMN "pricing_policy_id",
DROP COLUMN "subscription_id",
DROP COLUMN "prepaid";

ALTER TABLE "public"."FixedSlotTemplate"
DROP CONSTRAINT "FixedSlotTemplate_pricing_policy_id_fkey",
DROP CONSTRAINT "FixedSlotTemplate_subscription_id_fkey";

DROP INDEX "public"."idx_fixed_slot_pricing_policy";
DROP INDEX "public"."idx_fixed_slot_subscription";

ALTER TABLE "public"."FixedSlotTemplate"
DROP COLUMN "pricing_policy_id",
DROP COLUMN "subscription_id",
DROP COLUMN "prepaid";
