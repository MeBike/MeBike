ALTER TABLE "rental_billing_records"
  ADD COLUMN "coupon_rule_id" UUID,
  ADD COLUMN "coupon_rule_snapshot" JSONB;

CREATE INDEX "idx_rental_billing_records_coupon_rule"
  ON "rental_billing_records"("coupon_rule_id");

ALTER TABLE "rental_billing_records"
  ADD CONSTRAINT "rental_billing_records_coupon_rule_id_fkey"
  FOREIGN KEY ("coupon_rule_id") REFERENCES "coupon_rules"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "uq_coupon_rules_active_min_riding_minutes"
  ON "coupon_rules"("min_riding_minutes")
  WHERE "status" = 'ACTIVE'
    AND "trigger_type" = 'RIDING_DURATION'
    AND "discount_type" = 'FIXED_AMOUNT'
    AND "min_riding_minutes" IS NOT NULL;
