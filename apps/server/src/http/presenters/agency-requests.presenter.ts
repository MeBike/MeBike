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
    stationName: row.stationName,
    stationAddress: row.stationAddress,
    stationLatitude: row.stationLatitude,
    stationLongitude: row.stationLongitude,
    stationTotalCapacity: row.stationTotalCapacity,
    stationPickupSlotLimit: row.stationPickupSlotLimit,
    stationReturnSlotLimit: row.stationReturnSlotLimit,
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

export function toAgencyRequestAdminListItem(
  row: AgencyRequestRow,
): AgencyRequestsContracts.AdminAgencyRequestListItem {
  return {
    ...toAgencyRequest(row),
    requesterUser: row.requesterUser
      ? {
          id: row.requesterUser.id,
          fullName: row.requesterUser.fullName,
          email: row.requesterUser.email,
        }
      : null,
    reviewedByUser: row.reviewedByUser
      ? {
          id: row.reviewedByUser.id,
          fullName: row.reviewedByUser.fullName,
          email: row.reviewedByUser.email,
        }
      : null,
    approvedAgency: row.approvedAgency
      ? {
          id: row.approvedAgency.id,
          name: row.approvedAgency.name,
        }
      : null,
    createdAgencyUser: row.createdAgencyUser
      ? {
          id: row.createdAgencyUser.id,
          fullName: row.createdAgencyUser.fullName,
          email: row.createdAgencyUser.email,
        }
      : null,
  };
}
