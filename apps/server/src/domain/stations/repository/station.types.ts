import type { PageRequest, PageResult } from "@/domain/shared/pagination";

export type StationFilter = {
  name?: string;
  address?: string;
  capacity?: number;
};

export type StationSortField = "name" | "capacity" | "updatedAt";

export type StationRow = {
  id: string;
  name: string;
  address: string;
  capacity: number;
  latitude: number;
  longitude: number;
};

export type NearestStationRow = StationRow & {
  distance_meters: number;
};

export type StationRepo = {
  listWithOffset: (
    filter: StationFilter,
    pageReq: PageRequest<StationSortField>,
  ) => import("effect").Effect.Effect<PageResult<StationRow>>;

  getById: (id: string) => import("effect").Effect.Effect<import("effect").Option.Option<StationRow>>;

  listNearest: (args: {
    latitude: number;
    longitude: number;
    maxDistanceMeters?: number;
    page?: number;
    pageSize?: number;
  }) => import("effect").Effect.Effect<PageResult<NearestStationRow>>;
};
