import type { Option } from "effect";

import { Effect } from "effect";

import type { PageRequest } from "@/domain/shared/pagination";

import type { BikeStatus } from "../../../../generated/prisma/client";
import type {
  BikeCurrentlyRented,
  BikeCurrentlyReserved,
  BikeNotFound,
} from "../domain-errors";
import type {
  BikeFilter,
  BikeRow,
  BikeSortField,
} from "../models";

import { BikeServiceTag } from "../services/bike.service";

export type ListBikesInput = {
  filter: BikeFilter;
  pageReq: PageRequest<BikeSortField>;
};

export function listBikesUseCase(input: ListBikesInput) {
  return Effect.gen(function* () {
    const service = yield* BikeServiceTag;
    return yield* service.listBikes(input.filter, input.pageReq);
  });
}

export function getBikeDetailUseCase(bikeId: string) {
  return Effect.gen(function* () {
    const service = yield* BikeServiceTag;
    return yield* service.getBikeDetail(bikeId);
  });
}

export function reportBrokenBikeUseCase(bikeId: string) {
  return Effect.gen(function* () {
    const service = yield* BikeServiceTag;
    return yield* service.reportBrokenBike(bikeId);
  });
}

export function adminUpdateBikeUseCase(bikeId: string, patch: Partial<{
  chipId: string;
  stationId: string;
  status: BikeStatus;
  supplierId: string | null;
}>): Effect.Effect<
  Option.Option<BikeRow>,
  BikeCurrentlyRented | BikeCurrentlyReserved | BikeNotFound,
  BikeServiceTag
> {
  return Effect.gen(function* () {
    const service = yield* BikeServiceTag;
    return yield* service.adminUpdateBike(bikeId, patch);
  });
}

export function softDeleteBikeUseCase(bikeId: string): Effect.Effect<
  Option.Option<BikeRow>,
  BikeCurrentlyRented | BikeCurrentlyReserved | BikeNotFound,
  BikeServiceTag
> {
  return Effect.gen(function* () {
    const service = yield* BikeServiceTag;
    return yield* service.softDeleteBike(bikeId);
  });
}
