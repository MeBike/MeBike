import type { PageRequest } from "@/domain/shared/pagination";
import type { AccountStatus, StationType } from "generated/prisma/client";

export type AgencyStationRow = {
  readonly id: string;
  readonly name: string;
  readonly address: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly stationType: StationType;
  readonly totalCapacity: number;
  readonly returnSlotLimit: number;
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

export type AgencyStatsPeriod = {
  readonly from: Date;
  readonly to: Date;
};

export type AgencyOperatorStats = {
  readonly totalOperators: number;
  readonly activeOperators: number;
};

export type AgencyCurrentStationStats = {
  readonly totalCapacity: number;
  readonly returnSlotLimit: number;
  readonly totalBikes: number;
  readonly availableBikes: number;
  readonly bookedBikes: number;
  readonly brokenBikes: number;
  readonly reservedBikes: number;
  readonly maintainedBikes: number;
  readonly unavailableBikes: number;
  readonly emptySlots: number;
  readonly occupancyRate: number;
};

export type AgencyPickupStats = {
  readonly totalRentals: number;
  readonly activeRentals: number;
  readonly completedRentals: number;
  readonly totalRevenue: number;
  readonly avgDurationMinutes: number;
};

export type AgencyReturnStats = {
  readonly totalReturns: number;
  readonly agencyConfirmedReturns: number;
};

export type AgencyIncidentStats = {
  readonly totalIncidentsInPeriod: number;
  readonly openIncidents: number;
  readonly resolvedIncidentsInPeriod: number;
  readonly criticalOpenIncidents: number;
};

export type AgencyOperationalStats = {
  readonly agency: AgencyRow;
  readonly period: AgencyStatsPeriod;
  readonly operators: AgencyOperatorStats;
  readonly currentStation: AgencyCurrentStationStats;
  readonly pickups: AgencyPickupStats;
  readonly returns: AgencyReturnStats;
  readonly incidents: AgencyIncidentStats;
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
