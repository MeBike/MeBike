import type { PageRequest } from "@/domain/shared/pagination";

export type StationSortField = "name" | "capacity" | "updatedAt";

export type StationRow = {
  id: string;
  name: string;
  address: string;
  capacity: number;
  latitude: number;
  longitude: number;
};

export type StationFilter = {
  name?: string;
  address?: string;
  capacity?: number;
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
