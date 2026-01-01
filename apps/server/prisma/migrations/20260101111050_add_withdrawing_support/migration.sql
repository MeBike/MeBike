/*
  Warnings:

  - A unique constraint covering the columns `[stripe_connected_account_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "WalletWithdrawalStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "stripe_connected_account_id" TEXT,
ADD COLUMN     "stripe_payouts_enabled" BOOLEAN;

-- CreateTable
CREATE TABLE "wallet_withdrawals" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "wallet_id" UUID NOT NULL,
    "amount" BIGINT NOT NULL,
    "currency" VARCHAR(8) NOT NULL,
    "status" "WalletWithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "idempotency_key" TEXT NOT NULL,
    "stripe_transfer_id" TEXT,
    "stripe_payout_id" TEXT,
    "failure_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "wallet_withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_wallet_withdrawals_user" ON "wallet_withdrawals"("user_id");

-- CreateIndex
CREATE INDEX "idx_wallet_withdrawals_wallet" ON "wallet_withdrawals"("wallet_id");

-- CreateIndex
CREATE INDEX "idx_wallet_withdrawals_status_created_at" ON "wallet_withdrawals"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_wallet_withdrawals_idempotency_key" ON "wallet_withdrawals"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripe_connected_account_id_key" ON "User"("stripe_connected_account_id");

-- AddForeignKey
ALTER TABLE "wallet_withdrawals" ADD CONSTRAINT "wallet_withdrawals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_withdrawals" ADD CONSTRAINT "wallet_withdrawals_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
