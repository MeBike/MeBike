import type { AgencyRequestsContracts } from "@mebike/shared";

import type { AgencyRequestRow } from "@/domain/agency-requests";

export function toAgencyRequest(
  row: AgencyRequestRow,
): AgencyRequestsContracts.AgencyRequest {
  return {
    id: row.id,
    requesterUserId: row.requesterUserId,
    requesterEmail: row.requesterEmail,
    requesterPhone: row.requesterPhone,
    agencyName: row.agencyName,
    agencyAddress: row.agencyAddress,
    agencyContactPhone: row.agencyContactPhone,
    status: row.status,
    description: row.description,
    reviewedByUserId: row.reviewedByUserId,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    approvedAgencyId: row.approvedAgencyId,
    createdAgencyUserId: row.createdAgencyUserId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
