import type { Effect, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";
import type { BikeStatus } from "generated/prisma/client";

import type { DuplicateChipId } from "../domain-errors";
import type { BikeFilter, BikeRow, BikeSortField } from "../models";

export type BikeCreateInput = {
  chipId: string;
  stationId: string;
  supplierId: string;
  status: BikeStatus;
};

export type BikeUpdatePatch = Partial<{
  chipId: string;
  stationId: string;
  status: BikeStatus;
  supplierId: string | null;
}>;

export type BikeQueryRepo = {
  getById: (bikeId: string) => Effect.Effect<Option.Option<BikeRow>>;
  countAvailableByStation: (stationId: string) => Effect.Effect<number>;
  findAvailableByStation: (
    stationId: string,
  ) => Effect.Effect<Option.Option<BikeRow>>;
  listByStationWithOffset: (
    stationId: string | undefined,
    filter: BikeFilter,
    pageReq: PageRequest<BikeSortField>,
  ) => Effect.Effect<PageResult<BikeRow>>;
};

export type BikeCommandRepo = {
  create: (input: BikeCreateInput) => Effect.Effect<BikeRow, DuplicateChipId>;
  updateStatus: (
    bikeId: string,
    status: BikeStatus,
  ) => Effect.Effect<Option.Option<BikeRow>>;
  updateStatusAt: (
    bikeId: string,
    status: BikeStatus,
    updatedAt: Date,
  ) => Effect.Effect<Option.Option<BikeRow>>;
  updateStatusAndStationAt: (
    bikeId: string,
    status: BikeStatus,
    stationId: string,
    updatedAt: Date,
  ) => Effect.Effect<Option.Option<BikeRow>>;
  updateManyStatusAt: (
    bikeIds: string[],
    status: BikeStatus,
    updatedAt: Date,
  ) => Effect.Effect<number>;
  updateManyStationAt: (
    bikeIds: string[],
    stationId: string | null,
    updatedAt: Date,
  ) => Effect.Effect<number>;
  updateManyStatusAndStationAt: (
    bikeIds: string[],
    status: BikeStatus,
    stationId: string,
    updatedAt: Date,
  ) => Effect.Effect<number>;
  bookBikeIfAvailable: (
    bikeId: string,
    updatedAt: Date,
  ) => Effect.Effect<boolean>;
  reserveBikeIfAvailable: (
    bikeId: string,
    updatedAt: Date,
  ) => Effect.Effect<boolean>;
  bookBikeIfReserved: (
    bikeId: string,
    updatedAt: Date,
  ) => Effect.Effect<boolean>;
  releaseBikeIfReserved: (
    bikeId: string,
    updatedAt: Date,
  ) => Effect.Effect<boolean>;
  updateById: (
    bikeId: string,
    patch: BikeUpdatePatch,
  ) => Effect.Effect<Option.Option<BikeRow>, DuplicateChipId>;
};

export type BikeRepo = BikeQueryRepo & BikeCommandRepo;
