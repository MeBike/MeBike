import type { Prisma as PrismaTypes } from "generated/prisma/client";

import type { UserRow } from "../models";

export const selectUserRow = {
  id: true,
  fullname: true,
  email: true,
  phoneNumber: true,
  username: true,
  passwordHash: true,
  avatar: true,
  location: true,
  role: true,
  verify: true,
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
        },
      },
      technicianTeam: {
        select: {
          id: true,
          name: true,
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
    fullname: row.fullname,
    email: row.email,
    phoneNumber: row.phoneNumber,
    username: row.username,
    passwordHash: row.passwordHash,
    avatar: row.avatar,
    location: row.location,
    role: row.role,
    verify: row.verify,
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
              }
            : null,
          technicianTeam: row.orgAssignment.technicianTeam
            ? {
                id: row.orgAssignment.technicianTeam.id,
                name: row.orgAssignment.technicianTeam.name,
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
