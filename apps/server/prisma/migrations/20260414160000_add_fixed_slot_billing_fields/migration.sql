-- AlterTable
ALTER TABLE "FixedSlotTemplate"
ADD COLUMN "pricing_policy_id" UUID,
ADD COLUMN "subscription_id" UUID,
ADD COLUMN "prepaid" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "idx_fixed_slot_pricing_policy" ON "FixedSlotTemplate"("pricing_policy_id");

-- CreateIndex
CREATE INDEX "idx_fixed_slot_subscription" ON "FixedSlotTemplate"("subscription_id");

-- AddForeignKey
ALTER TABLE "FixedSlotTemplate"
ADD CONSTRAINT "FixedSlotTemplate_pricing_policy_id_fkey"
FOREIGN KEY ("pricing_policy_id") REFERENCES "pricing_policies"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixedSlotTemplate"
ADD CONSTRAINT "FixedSlotTemplate_subscription_id_fkey"
FOREIGN KEY ("subscription_id") REFERENCES "Subscription"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
