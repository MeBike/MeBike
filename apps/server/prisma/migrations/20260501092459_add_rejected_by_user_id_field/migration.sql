-- AlterTable
ALTER TABLE "redistribution_requests" ADD COLUMN     "rejected_by_user_id" UUID;

-- CreateIndex
CREATE INDEX "idx_redistribution_requests_rejected_by" ON "redistribution_requests"("rejected_by_user_id");

-- AddForeignKey
ALTER TABLE "redistribution_requests" ADD CONSTRAINT "redistribution_requests_rejected_by_user_id_fkey" FOREIGN KEY ("rejected_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
