DROP INDEX IF EXISTS "uq_coupon_rules_active_min_riding_minutes";

CREATE INDEX IF NOT EXISTS "idx_coupon_rules_active_min_riding_minutes_window"
  ON "coupon_rules"("min_riding_minutes", "active_from", "active_to")
  WHERE "status" = 'ACTIVE'
    AND "trigger_type" = 'RIDING_DURATION'
    AND "discount_type" = 'FIXED_AMOUNT'
    AND "min_riding_minutes" IS NOT NULL;
