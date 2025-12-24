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
  nfcCardUid: true,
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
    nfcCardUid: row.nfcCardUid,
    updatedAt: row.updatedAt,
  };
}
