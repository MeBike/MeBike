ALTER TABLE "payment_attempts"
  DROP CONSTRAINT IF EXISTS "chk_payment_attempts_currency_usd";

ALTER TABLE "wallet_withdrawals"
  DROP CONSTRAINT IF EXISTS "chk_wallet_withdrawals_currency_usd";
