-- AlterTable
ALTER TABLE "redistribution_requests" ADD COLUMN "reverted_by_user_id" UUID;

-- CreateIndex
CREATE INDEX "idx_redistribution_requests_reverted_by" ON "redistribution_requests"("reverted_by_user_id");

-- AddForeignKey
ALTER TABLE "redistribution_requests" ADD CONSTRAINT "redistribution_requests_reverted_by_user_id_fkey" FOREIGN KEY ("reverted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
