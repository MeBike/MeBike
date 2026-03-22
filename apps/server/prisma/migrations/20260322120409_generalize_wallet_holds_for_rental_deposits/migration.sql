-- AlterEnum
ALTER TYPE "WalletHoldReason" ADD VALUE 'RENTAL_DEPOSIT';

-- DropForeignKey
ALTER TABLE "wallet_holds" DROP CONSTRAINT "wallet_holds_withdrawal_id_fkey";

-- AlterTable
ALTER TABLE "wallet_holds" ADD COLUMN     "forfeited_at" TIMESTAMPTZ,
ADD COLUMN     "rental_id" UUID,
ALTER COLUMN "withdrawal_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "idx_wallet_holds_rental" ON "wallet_holds"("rental_id");

-- AddForeignKey
ALTER TABLE "wallet_holds" ADD CONSTRAINT "wallet_holds_withdrawal_id_fkey" FOREIGN KEY ("withdrawal_id") REFERENCES "wallet_withdrawals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_holds" ADD CONSTRAINT "wallet_holds_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "Rental"("id") ON DELETE SET NULL ON UPDATE CASCADE;
