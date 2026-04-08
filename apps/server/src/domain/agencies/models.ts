import type { PageRequest } from "@/domain/shared/pagination";
import type { AccountStatus, StationType } from "generated/prisma/client";

export type AgencyStationRow = {
  readonly id: string;
  readonly name: string;
  readonly address: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly stationType: StationType;
};

export type AgencyRow = {
  readonly id: string;
  readonly name: string;
  readonly contactPhone: string | null;
  readonly status: AccountStatus;
  readonly station: AgencyStationRow | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type CreateAgencyInput = {
  readonly name: string;
  readonly contactPhone?: string | null;
  readonly status?: AccountStatus;
};

export type UpdateAgencyInput = {
  readonly name?: string;
  readonly contactPhone?: string | null;
  readonly status?: AccountStatus;
};

export type UpdateAgencyStatusInput = {
  readonly status: AccountStatus;
};

export type AgencyFilter = {
  readonly name?: string;
  readonly stationAddress?: string;
  readonly contactPhone?: string;
  readonly status?: AccountStatus;
};

export type AgencySortField = "name" | "status" | "createdAt" | "updatedAt";

export type ListAgenciesInput = {
  readonly filter: AgencyFilter;
  readonly pageReq: PageRequest<AgencySortField>;
};
