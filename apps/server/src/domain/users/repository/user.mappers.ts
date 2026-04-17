import type { Prisma as PrismaTypes } from "generated/prisma/client";

import type { UserRow } from "../models";

export const selectUserRow = {
  id: true,
  fullName: true,
  email: true,
  phoneNumber: true,
  username: true,
  passwordHash: true,
  avatarUrl: true,
  locationText: true,
  role: true,
  accountStatus: true,
  verifyStatus: true,
  orgAssignment: {
    select: {
      station: {
        select: {
          id: true,
          name: true,
        },
      },
      agency: {
        select: {
          id: true,
          name: true,
          status: true,
          station: {
            select: {
              id: true,
            },
          },
        },
      },
      technicianTeam: {
        select: {
          id: true,
          name: true,
          stationId: true,
        },
      },
    },
  },
  nfcCardUid: true,
  stripeConnectedAccountId: true,
  stripePayoutsEnabled: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies PrismaTypes.UserSelect;

export function toUserRow(row: PrismaTypes.UserGetPayload<{ select: typeof selectUserRow }>): UserRow {
  return {
    id: row.id,
    fullname: row.fullName,
    email: row.email,
    phoneNumber: row.phoneNumber,
    username: row.username,
    passwordHash: row.passwordHash,
    avatar: row.avatarUrl,
    location: row.locationText,
    role: row.role,
    accountStatus: row.accountStatus,
    verify: row.verifyStatus,
    orgAssignment: row.orgAssignment
      ? {
          station: row.orgAssignment.station
            ? {
                id: row.orgAssignment.station.id,
                name: row.orgAssignment.station.name,
              }
            : null,
          agency: row.orgAssignment.agency
            ? {
                id: row.orgAssignment.agency.id,
                name: row.orgAssignment.agency.name,
                status: row.orgAssignment.agency.status,
                stationId: row.orgAssignment.agency.station?.id ?? null,
              }
            : null,
          technicianTeam: row.orgAssignment.technicianTeam
            ? {
                id: row.orgAssignment.technicianTeam.id,
                name: row.orgAssignment.technicianTeam.name,
                stationId: row.orgAssignment.technicianTeam.stationId,
              }
            : null,
        }
      : null,
    nfcCardUid: row.nfcCardUid,
    stripeConnectedAccountId: row.stripeConnectedAccountId,
    stripePayoutsEnabled: row.stripePayoutsEnabled,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
