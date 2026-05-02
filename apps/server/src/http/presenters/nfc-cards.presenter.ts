import type { NfcCardsContracts } from "@mebike/shared";

import type { NfcCardRow } from "@/domain/nfc-cards";

export function toContractNfcCard(card: NfcCardRow): NfcCardsContracts.NfcCard {
  return {
    id: card.id,
    uid: card.uid,
    status: card.status,
    assigned_user_id: card.assignedUserId,
    assigned_user: card.assignedUser
      ? {
          id: card.assignedUser.id,
          fullname: card.assignedUser.fullname,
          email: card.assignedUser.email,
          account_status: card.assignedUser.accountStatus,
          verify_status: card.assignedUser.verify,
        }
      : null,
    issued_at: card.issuedAt?.toISOString() ?? null,
    returned_at: card.returnedAt?.toISOString() ?? null,
    blocked_at: card.blockedAt?.toISOString() ?? null,
    lost_at: card.lostAt?.toISOString() ?? null,
    created_at: card.createdAt.toISOString(),
    updated_at: card.updatedAt.toISOString(),
  };
}
