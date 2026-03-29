import type { AccountStatus } from "generated/prisma/client";

export type AgencyRow = {
  readonly id: string;
  readonly name: string;
  readonly address: string | null;
  readonly contactPhone: string | null;
  readonly status: AccountStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type CreateAgencyInput = {
  readonly name: string;
  readonly address?: string | null;
  readonly contactPhone?: string | null;
  readonly status?: AccountStatus;
};
