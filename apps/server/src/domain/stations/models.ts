import type { PageRequest } from "@/domain/shared/pagination";

export type StationSortField = "name" | "totalCapacity" | "updatedAt";

export type StationRow = {
  id: string;
  name: string;
  address: string;
  totalCapacity: number;
  pickupSlotLimit: number;
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
};

export type CreateStationInput = {
  name: string;
  address: string;
  totalCapacity: number;
  pickupSlotLimit?: number;
  returnSlotLimit?: number;
  latitude: number;
  longitude: number;
};

export type UpdateStationInput = {
  name?: string;
  address?: string;
  totalCapacity?: number;
  pickupSlotLimit?: number;
  returnSlotLimit?: number;
  latitude?: number;
  longitude?: number;
};

export type StationFilter = {
  name?: string;
  address?: string;
  totalCapacity?: number;
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

export type ListStationsInput = {
  filter: StationFilter;
  pageReq: PageRequest<StationSortField>;
};
