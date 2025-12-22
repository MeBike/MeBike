-- CreateEnum
CREATE TYPE "AuthEventType" AS ENUM ('SESSION_ISSUED');

-- CreateTable
CREATE TABLE "AuthEvent" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "AuthEventType" NOT NULL DEFAULT 'SESSION_ISSUED',
    "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_auth_events_user" ON "AuthEvent"("user_id");

-- CreateIndex
CREATE INDEX "idx_auth_events_occurred_at" ON "AuthEvent"("occurred_at");

-- CreateIndex
CREATE INDEX "idx_auth_events_active_users" ON "AuthEvent"("occurred_at", "user_id");

-- AddForeignKey
ALTER TABLE "AuthEvent" ADD CONSTRAINT "AuthEvent_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
