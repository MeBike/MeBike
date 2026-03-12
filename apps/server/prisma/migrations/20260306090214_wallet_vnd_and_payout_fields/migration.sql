-- AlterTable
ALTER TABLE "wallet_withdrawals" ADD COLUMN     "fx_quoted_at" TIMESTAMPTZ,
ADD COLUMN     "fx_rate" BIGINT,
ADD COLUMN     "payout_amount" BIGINT,
ADD COLUMN     "payout_currency" VARCHAR(8);
