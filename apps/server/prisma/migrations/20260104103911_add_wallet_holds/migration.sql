-- CreateEnum
CREATE TYPE "WalletHoldStatus" AS ENUM ('ACTIVE', 'RELEASED', 'SETTLED');

-- CreateEnum
CREATE TYPE "WalletHoldReason" AS ENUM ('WITHDRAWAL');

-- CreateTable
CREATE TABLE "wallet_holds" (
    "id" UUID NOT NULL,
    "wallet_id" UUID NOT NULL,
    "withdrawal_id" UUID NOT NULL,
    "amount" BIGINT NOT NULL,
    "status" "WalletHoldStatus" NOT NULL DEFAULT 'ACTIVE',
    "reason" "WalletHoldReason" NOT NULL DEFAULT 'WITHDRAWAL',
    "released_at" TIMESTAMPTZ,
    "settled_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "wallet_holds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wallet_holds_withdrawal_id_key" ON "wallet_holds"("withdrawal_id");

-- CreateIndex
CREATE INDEX "idx_wallet_holds_wallet" ON "wallet_holds"("wallet_id");

-- CreateIndex
CREATE INDEX "idx_wallet_holds_status_created_at" ON "wallet_holds"("status", "created_at");

-- AddForeignKey
ALTER TABLE "wallet_holds" ADD CONSTRAINT "wallet_holds_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_holds" ADD CONSTRAINT "wallet_holds_withdrawal_id_fkey" FOREIGN KEY ("withdrawal_id") REFERENCES "wallet_withdrawals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
