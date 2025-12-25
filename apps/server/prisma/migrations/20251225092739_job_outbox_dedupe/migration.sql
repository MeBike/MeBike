-- CreateEnum
CREATE TYPE "JobOutboxStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "job_outbox" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "dedupe_key" TEXT,
    "payload" JSONB NOT NULL,
    "run_at" TIMESTAMPTZ NOT NULL,
    "status" "JobOutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_at" TIMESTAMPTZ,
    "locked_by" TEXT,
    "last_error" TEXT,
    "sent_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_job_outbox_status_run_at" ON "job_outbox"("status", "run_at");

-- CreateIndex
CREATE INDEX "idx_job_outbox_type_status" ON "job_outbox"("type", "status");
CREATE UNIQUE INDEX job_outbox_type_dedupe_active
  ON job_outbox(type, dedupe_key)
  WHERE dedupe_key IS NOT NULL AND status IN ('PENDING','SENT');
