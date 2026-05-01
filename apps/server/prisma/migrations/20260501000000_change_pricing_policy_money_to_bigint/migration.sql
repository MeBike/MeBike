DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "public"."pricing_policies"
    WHERE "base_rate" <> trunc("base_rate")
      OR "reservation_fee" <> trunc("reservation_fee")
      OR "deposit_required" <> trunc("deposit_required")
  ) THEN
    RAISE EXCEPTION 'Cannot migrate pricing_policies money columns with fractional values';
  END IF;
END $$;

ALTER TABLE "public"."pricing_policies"
  ALTER COLUMN "base_rate" TYPE BIGINT USING "base_rate"::bigint,
  ALTER COLUMN "reservation_fee" TYPE BIGINT USING "reservation_fee"::bigint,
  ALTER COLUMN "deposit_required" TYPE BIGINT USING "deposit_required"::bigint;
