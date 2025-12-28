-- Add a unique index for wallet transaction idempotency keys (e.g. refunds).
-- Postgres unique indexes allow multiple NULLs, so existing NULL hashes are unaffected.
CREATE UNIQUE INDEX "uq_wallet_tx_hash" ON "wallet_transactions"("hash");
