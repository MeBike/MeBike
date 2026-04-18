import type { PageRequest } from "@/domain/shared/pagination";
import type { StationType } from "generated/prisma/client";

export type StationSortField = "name" | "totalCapacity" | "updatedAt";

export type StationWorkerRow = {
  userId: string;
  fullName: string;
  role: "STAFF" | "MANAGER" | "TECHNICIAN";
  technicianTeamId: string | null;
  technicianTeamName: string | null;
};

export type StationContextRow = {
  id: string;
  name: string;
  address: string;
};

export type StationRow = {
  id: string;
  name: string;
  address: string;
  stationType: StationType;
  agencyId: string | null;
  totalCapacity: number;
  returnSlotLimit: number;
  latitude: number;
  longitude: number;
  createdAt: string;
  updatedAt: string;
  totalBikes: number;
  availableBikes: number;
  bookedBikes: number;
  brokenBikes: number;
  reservedBikes: number;
  maintainedBikes: number;
  unavailableBikes: number;
  activeReturnSlots: number;
  availableReturnSlots: number;
  emptySlots: number;
  workers?: readonly StationWorkerRow[];
};

export type CreateStationInput = {
  name: string;
  address: string;
  stationType?: StationType;
  agencyId?: string | null;
  totalCapacity: number;
  returnSlotLimit?: number;
  latitude: number;
  longitude: number;
};

export type UpdateStationInput = {
  name?: string;
  address?: string;
  stationType?: StationType;
  agencyId?: string | null;
  totalCapacity?: number;
  returnSlotLimit?: number;
  latitude?: number;
  longitude?: number;
};

export type StationFilter = {
  id?: string;
  name?: string;
  address?: string;
  stationType?: StationType;
  agencyId?: string;
  totalCapacity?: number;
  excludeAssignedStaff?: boolean;
};

export type NearestStationRow = StationRow & {
  distanceMeters: number;
};

export type NearestSearchArgs = {
  latitude: number;
  longitude: number;
  maxDistanceMeters?: number;
  page?: number;
  pageSize?: number;
};

export type StationRevenueRow = {
  stationId: string;
  name: string;
  address: string;
  totalRentals: number;
  totalRevenue: number;
  totalDuration: number;
  avgDuration: number;
};

export type StationRevenueStats = {
  period: {
    from: Date;
    to: Date;
  };
  summary: {
    totalStations: number;
    totalRevenue: number;
    totalRentals: number;
    avgRevenuePerStation: number;
  };
  stations: readonly StationRevenueRow[];
};

export type ListStationsInput = {
  filter: StationFilter;
  pageReq: PageRequest<StationSortField>;
};
