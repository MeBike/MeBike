import type { Prisma as PrismaTypes } from "generated/prisma/client";

import type { AgencyRequestRow } from "../models";

export const selectAgencyRequestRow = {
  id: true,
  requesterUserId: true,
  requesterEmail: true,
  requesterPhone: true,
  agencyName: true,
  agencyAddress: true,
  agencyContactPhone: true,
  status: true,
  description: true,
  reviewedByUserId: true,
  reviewedAt: true,
  approvedAgencyId: true,
  createdAgencyUserId: true,
  createdAt: true,
  updatedAt: true,
  requesterUser: {
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  },
  reviewedByUser: {
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  },
  approvedAgency: {
    select: {
      id: true,
      name: true,
    },
  },
  createdAgencyUser: {
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  },
} satisfies PrismaTypes.AgencyRequestSelect;

export function toAgencyRequestRow(
  row: PrismaTypes.AgencyRequestGetPayload<{ select: typeof selectAgencyRequestRow }>,
): AgencyRequestRow {
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
    reviewedAt: row.reviewedAt,
    approvedAgencyId: row.approvedAgencyId,
    createdAgencyUserId: row.createdAgencyUserId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
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
