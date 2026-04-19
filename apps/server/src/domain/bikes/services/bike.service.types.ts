import type { Effect, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";
import type { BikeStatus } from "generated/prisma/client";

import type {
  BikeCurrentlyRented,
  BikeCurrentlyReserved,
  BikeNotFound,
  BikeStationNotFound,
  BikeSupplierNotFound,
  InvalidBikeStatus,
} from "../domain-errors";
import type { BikeFilter, BikeRow, BikeSortField } from "../models";
import type { BikeUpdatePatch } from "../repository/bike.repository.types";

export type BikeManageableStatus = Extract<BikeStatus, "AVAILABLE" | "BROKEN">;

export type BikeService = {
  createBike: (
    input: {
      stationId: string;
      supplierId: string;
      status?: BikeStatus;
    },
  ) => Effect.Effect<
    BikeRow,
    BikeStationNotFound | BikeSupplierNotFound
  >;

  listBikes: (
    filter: BikeFilter,
    pageReq: PageRequest<BikeSortField>,
  ) => Effect.Effect<PageResult<BikeRow>>;

  getBikeDetail: (bikeId: string) => Effect.Effect<Option.Option<BikeRow>>;

  reportBrokenBike: (bikeId: string) => Effect.Effect<Option.Option<BikeRow>>;

  adminUpdateBike: (
    bikeId: string,
    patch: BikeUpdatePatch,
  ) => Effect.Effect<
    Option.Option<BikeRow>,
    | BikeCurrentlyRented
    | BikeCurrentlyReserved
    | BikeNotFound
    | BikeStationNotFound
    | BikeSupplierNotFound
  >;

  updateBikeStatusInStationScope: (
    bikeId: string,
    input: {
      stationId: string;
      status: BikeManageableStatus;
    },
  ) => Effect.Effect<
    BikeRow,
    | BikeNotFound
    | InvalidBikeStatus
  >;
};
