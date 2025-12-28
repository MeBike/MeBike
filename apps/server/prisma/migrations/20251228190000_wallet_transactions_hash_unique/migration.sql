-- Add a unique constraint for wallet transaction idempotency keys (e.g. refunds).
-- Note: Postgres unique indexes allow multiple NULLs, so existing NULL hashes are unaffected.
CREATE UNIQUE INDEX "uq_wallet_tx_hash" ON "wallet_transactions"("hash");
