-- CreateEnum
CREATE TYPE "WalletStatus" AS ENUM ('ACTIVE', 'FROZEN');

-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('DEPOSIT', 'DEBIT', 'REFUND', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "WalletTransactionStatus" AS ENUM ('SUCCESS', 'PENDING', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE');

-- CreateEnum
CREATE TYPE "PaymentKind" AS ENUM ('TOPUP', 'WITHDRAW');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WalletWithdrawalStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "WalletHoldStatus" AS ENUM ('ACTIVE', 'RELEASED', 'SETTLED');

-- CreateEnum
CREATE TYPE "WalletHoldReason" AS ENUM ('WITHDRAWAL');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "stripe_connected_account_id" TEXT,
ADD COLUMN "stripe_payouts_enabled" BOOLEAN;

-- AlterTable
ALTER TABLE "Subscription" ALTER COLUMN "price" SET DATA TYPE BIGINT;

-- CreateTable
CREATE TABLE "wallets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "balance" BIGINT NOT NULL DEFAULT 0,
    "reserved_balance" BIGINT NOT NULL DEFAULT 0,
    "status" "WalletStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" UUID NOT NULL,
    "wallet_id" UUID NOT NULL,
    "amount" BIGINT NOT NULL,
    "fee" BIGINT NOT NULL DEFAULT 0,
    "description" TEXT,
    "hash" TEXT,
    "type" "WalletTransactionType" NOT NULL,
    "status" "WalletTransactionStatus" NOT NULL DEFAULT 'SUCCESS',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_attempts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "wallet_id" UUID NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "provider_ref" TEXT,
    "kind" "PaymentKind" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount_minor" BIGINT NOT NULL,
    "fee_minor" BIGINT NOT NULL DEFAULT 0,
    "currency" VARCHAR(8) NOT NULL,
    "failure_reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "payment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_withdrawals" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "wallet_id" UUID NOT NULL,
    "amount" BIGINT NOT NULL,
    "currency" VARCHAR(8) NOT NULL,
    "payout_amount" BIGINT,
    "payout_currency" VARCHAR(8),
    "fx_rate" BIGINT,
    "fx_quoted_at" TIMESTAMPTZ,
    "status" "WalletWithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "idempotency_key" TEXT NOT NULL,
    "stripe_transfer_id" TEXT,
    "stripe_payout_id" TEXT,
    "failure_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "wallet_withdrawals_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX "wallets_user_id_key" ON "wallets"("user_id");

-- CreateIndex
CREATE INDEX "idx_wallets_status" ON "wallets"("status");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripe_connected_account_id_key" ON "User"("stripe_connected_account_id");

-- CreateIndex
CREATE INDEX "idx_wallet_tx_wallet" ON "wallet_transactions"("wallet_id");

-- CreateIndex
CREATE INDEX "idx_wallet_tx_type" ON "wallet_transactions"("type");

-- CreateIndex
CREATE UNIQUE INDEX "uq_wallet_tx_hash" ON "wallet_transactions"("hash");

-- CreateIndex
CREATE INDEX "idx_payment_attempts_user" ON "payment_attempts"("user_id");

-- CreateIndex
CREATE INDEX "idx_payment_attempts_wallet" ON "payment_attempts"("wallet_id");

-- CreateIndex
CREATE INDEX "idx_payment_attempts_status_created_at" ON "payment_attempts"("status", "created_at");

-- CreateIndex
CREATE INDEX "idx_payment_attempts_kind_status" ON "payment_attempts"("kind", "status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_payment_attempt_provider_ref" ON "payment_attempts"("provider", "provider_ref");

-- CreateIndex
CREATE INDEX "idx_wallet_withdrawals_user" ON "wallet_withdrawals"("user_id");

-- CreateIndex
CREATE INDEX "idx_wallet_withdrawals_wallet" ON "wallet_withdrawals"("wallet_id");

-- CreateIndex
CREATE INDEX "idx_wallet_withdrawals_status_created_at" ON "wallet_withdrawals"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_wallet_withdrawals_idempotency_key" ON "wallet_withdrawals"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_holds_withdrawal_id_key" ON "wallet_holds"("withdrawal_id");

-- CreateIndex
CREATE INDEX "idx_wallet_holds_wallet" ON "wallet_holds"("wallet_id");

-- CreateIndex
CREATE INDEX "idx_wallet_holds_status_created_at" ON "wallet_holds"("status", "created_at");

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_withdrawals" ADD CONSTRAINT "wallet_withdrawals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_withdrawals" ADD CONSTRAINT "wallet_withdrawals_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_holds" ADD CONSTRAINT "wallet_holds_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_holds" ADD CONSTRAINT "wallet_holds_withdrawal_id_fkey" FOREIGN KEY ("withdrawal_id") REFERENCES "wallet_withdrawals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
