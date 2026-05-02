import type { Prisma as PrismaTypes } from "generated/prisma/client";

import type { NfcCardRow } from "../models";

export const selectNfcCardRow = {
  id: true,
  uid: true,
  status: true,
  assignedUserId: true,
  issuedAt: true,
  returnedAt: true,
  blockedAt: true,
  lostAt: true,
  createdAt: true,
  updatedAt: true,
  assignedUser: {
    select: {
      id: true,
      fullName: true,
      email: true,
      accountStatus: true,
      verifyStatus: true,
    },
  },
} as const satisfies PrismaTypes.NfcCardSelect;

export function toNfcCardRow(
  row: PrismaTypes.NfcCardGetPayload<{ select: typeof selectNfcCardRow }>,
): NfcCardRow {
  return {
    id: row.id,
    uid: row.uid,
    status: row.status,
    assignedUserId: row.assignedUserId,
    issuedAt: row.issuedAt,
    returnedAt: row.returnedAt,
    blockedAt: row.blockedAt,
    lostAt: row.lostAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    assignedUser: row.assignedUser
      ? {
          id: row.assignedUser.id,
          fullname: row.assignedUser.fullName,
          email: row.assignedUser.email,
          accountStatus: row.assignedUser.accountStatus,
          verify: row.assignedUser.verifyStatus,
        }
      : null,
  };
}
