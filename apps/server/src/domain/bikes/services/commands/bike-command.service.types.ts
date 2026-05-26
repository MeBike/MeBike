import type { Effect, Option } from "effect";

import type { BikeStatus } from "generated/prisma/client";

import type {
  BikeCurrentlyRented,
  BikeCurrentlyReserved,
  BikeNotFound,
  BikeRepositoryError,
  BikeStationNotFound,
  BikeStationPlacementCapacityExceeded,
  BikeSupplierNotActive,
  BikeSupplierNotFound,
  InvalidBikeStatus,
} from "../../domain-errors";
import type { BikeRow } from "../../models";

export type BikeManageableStatus = Extract<BikeStatus, "AVAILABLE" | "BROKEN" | "FIXED">;
export type AdminBikeManageableStatus = Extract<BikeStatus, "AVAILABLE" | "BROKEN" | "DISABLED">;

export type CreateBikeInput = {
  stationId: string;
  supplierId: string;
  status?: BikeStatus;
};

export type BikeStationScopedStatusUpdateInput = {
  stationId: string;
  status: BikeManageableStatus;
  role: string;
};

export type AdminBikeUpdatePatch = Partial<{
  stationId: string;
  status: AdminBikeManageableStatus;
  supplierId: string | null;
}>;

export type BikeCommandService = {
  createBike: (
    input: CreateBikeInput,
  ) => Effect.Effect<
    BikeRow,
    | BikeRepositoryError
    | BikeStationNotFound
    | BikeStationPlacementCapacityExceeded
    | BikeSupplierNotActive
    | BikeSupplierNotFound
  >;

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
    | BikeSupplierNotActive
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
