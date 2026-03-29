import type { PageRequest } from "@/domain/shared/pagination";
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

export type AgencyFilter = {
  readonly name?: string;
  readonly address?: string;
  readonly contactPhone?: string;
  readonly status?: AccountStatus;
};

export type AgencySortField = "name" | "status" | "createdAt" | "updatedAt";

export type ListAgenciesInput = {
  readonly filter: AgencyFilter;
  readonly pageReq: PageRequest<AgencySortField>;
};
