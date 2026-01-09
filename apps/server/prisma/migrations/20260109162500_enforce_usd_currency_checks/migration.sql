-- Enforce USD-only currency for wallet-related Stripe flows.
--
-- NOTE:
-- - This migration will FAIL if you have existing non-USD rows in these tables.
-- - Clean up or fix existing data before applying, or change to NOT VALID + later VALIDATE.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "payment_attempts" WHERE lower("currency") <> 'usd') THEN
    RAISE EXCEPTION 'Cannot add USD CHECK constraint: payment_attempts contains non-USD rows';
  END IF;

  IF EXISTS (SELECT 1 FROM "wallet_withdrawals" WHERE lower("currency") <> 'usd') THEN
    RAISE EXCEPTION 'Cannot add USD CHECK constraint: wallet_withdrawals contains non-USD rows';
  END IF;
END $$;

ALTER TABLE "payment_attempts"
  ADD CONSTRAINT "chk_payment_attempts_currency_usd"
  CHECK (lower("currency") = 'usd');
ALTER TABLE "wallet_withdrawals"
  ADD CONSTRAINT "chk_wallet_withdrawals_currency_usd"
  CHECK (lower("currency") = 'usd');

