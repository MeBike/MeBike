-- CreateEnum
CREATE TYPE "NfcCardStatus" AS ENUM ('UNASSIGNED', 'ACTIVE', 'BLOCKED', 'LOST');

-- CreateTable
CREATE TABLE "nfc_cards" (
    "id" UUID NOT NULL,
    "uid" TEXT NOT NULL,
    "status" "NfcCardStatus" NOT NULL DEFAULT 'UNASSIGNED',
    "assigned_user_id" UUID,
    "issued_at" TIMESTAMPTZ,
    "returned_at" TIMESTAMPTZ,
    "blocked_at" TIMESTAMPTZ,
    "lost_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "nfc_cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "nfc_cards_uid_key" ON "nfc_cards"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "nfc_cards_assigned_user_id_key" ON "nfc_cards"("assigned_user_id");

-- CreateIndex
CREATE INDEX "idx_nfc_cards_status" ON "nfc_cards"("status");

-- Backfill existing legacy user card bindings into inventory.
INSERT INTO "nfc_cards" (
    "id",
    "uid",
    "status",
    "assigned_user_id",
    "issued_at",
    "created_at",
    "updated_at"
)
SELECT
    (
        substr(md5('nfc-card:' || "nfc_card_uid"), 1, 8)
        || '-'
        || substr(md5('nfc-card:' || "nfc_card_uid"), 9, 4)
        || '-'
        || substr(md5('nfc-card:' || "nfc_card_uid"), 13, 4)
        || '-'
        || substr(md5('nfc-card:' || "nfc_card_uid"), 17, 4)
        || '-'
        || substr(md5('nfc-card:' || "nfc_card_uid"), 21, 12)
    )::uuid,
    "nfc_card_uid",
    'ACTIVE'::"NfcCardStatus",
    "id",
    "updated_at",
    "created_at",
    "updated_at"
FROM "users"
WHERE "nfc_card_uid" IS NOT NULL;

-- AddForeignKey
ALTER TABLE "nfc_cards" ADD CONSTRAINT "nfc_cards_assigned_user_id_fkey" FOREIGN KEY ("assigned_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
