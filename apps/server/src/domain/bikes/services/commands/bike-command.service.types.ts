import type { Effect, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";
import type { BikeStatus } from "generated/prisma/client";

import type {
  BikeCurrentlyRented,
  BikeCurrentlyReserved,
  BikeNotFound,
  BikeRepositoryError,
  BikeStationNotFound,
  BikeStationPlacementCapacityExceeded,
  BikeSupplierNotFound,
  InvalidBikeStatus,
} from "../../domain-errors";
import type { BikeFilter, BikeRow, BikeSortField } from "../../models";

export type BikeManageableStatus = Extract<BikeStatus, "AVAILABLE" | "BROKEN">;
export type AdminBikeManageableStatus = Extract<BikeStatus, "AVAILABLE" | "BROKEN" | "MAINTAINED" | "UNAVAILABLE">;

export type CreateBikeInput = {
  stationId: string;
  supplierId: string;
  status?: BikeStatus;
};

export type BikeStationScopedStatusUpdateInput = {
  stationId: string;
  status: BikeManageableStatus;
};

export type AdminBikeUpdatePatch = Partial<{
  stationId: string;
  status: AdminBikeManageableStatus;
  supplierId: string | null;
}>;

export type BikeService = {
  createBike: (
    input: CreateBikeInput,
  ) => Effect.Effect<
    BikeRow,
    BikeRepositoryError | BikeStationNotFound | BikeStationPlacementCapacityExceeded | BikeSupplierNotFound
  >;

  listBikes: (
    filter: BikeFilter,
    pageReq: PageRequest<BikeSortField>,
  ) => Effect.Effect<PageResult<BikeRow>>;

  getBikeDetail: (bikeId: string) => Effect.Effect<Option.Option<BikeRow>>;

  adminUpdateBike: (
    bikeId: string,
    patch: AdminBikeUpdatePatch,
  ) => Effect.Effect<
    Option.Option<BikeRow>,
    | BikeCurrentlyRented
    | BikeCurrentlyReserved
    | BikeNotFound
    | BikeRepositoryError
    | InvalidBikeStatus
    | BikeStationPlacementCapacityExceeded
    | BikeStationNotFound
    | BikeSupplierNotFound
  >;

  updateBikeStatusInStationScope: (
    bikeId: string,
    input: BikeStationScopedStatusUpdateInput,
  ) => Effect.Effect<
    BikeRow,
    | BikeNotFound
    | InvalidBikeStatus
  >;
};
