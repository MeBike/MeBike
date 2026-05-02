import type {
  AccountStatus,
  NfcCardStatus,
  UserVerifyStatus,
} from "generated/prisma/client";

import type { PageRequest } from "@/domain/shared/pagination";

export type NfcCardAssignedUser = {
  readonly id: string;
  readonly fullname: string;
  readonly email: string;
  readonly accountStatus: AccountStatus;
  readonly verify: UserVerifyStatus;
};

export type NfcCardRow = {
  readonly id: string;
  readonly uid: string;
  readonly status: NfcCardStatus;
  readonly assignedUserId: string | null;
  readonly assignedUser: NfcCardAssignedUser | null;
  readonly issuedAt: Date | null;
  readonly returnedAt: Date | null;
  readonly blockedAt: Date | null;
  readonly lostAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type CreateNfcCardInput = {
  readonly uid: string;
};

export type AssignNfcCardInput = {
  readonly nfcCardId: string;
  readonly userId: string;
  readonly now: Date;
};

export type UpdateNfcCardStatusInput = {
  readonly nfcCardId: string;
  readonly status: NfcCardStatus;
  readonly now: Date;
};

export type NfcCardFilter = {
  readonly status?: NfcCardStatus;
  readonly assignedUserId?: string;
  readonly uid?: string;
};

export type NfcCardListInput = NfcCardFilter & Pick<PageRequest, "page" | "pageSize">;
