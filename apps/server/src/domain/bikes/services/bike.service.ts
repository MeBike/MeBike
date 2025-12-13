import type { Option } from "effect";

import { Context, Effect, Layer } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";

import type { BikeStatus } from "../../../../generated/prisma/client";
import type {
  BikeFilter,
  BikeRow,
  BikeSortField,
} from "../models";

import { BikeRepository } from "../repository/bike.repository";

export type BikeService = {
  listBikes: (
    filter: BikeFilter,
    pageReq: PageRequest<BikeSortField>,
  ) => Effect.Effect<PageResult<BikeRow>>;

  getBikeDetail: (bikeId: string) => Effect.Effect<Option.Option<BikeRow>>;

  reportBrokenBike: (
    bikeId: string,
  ) => Effect.Effect<Option.Option<BikeRow>>;

};

export class BikeServiceTag extends Context.Tag("BikeService")<
  BikeServiceTag,
  BikeService
>() {}

export const BikeServiceLive = Layer.effect(
  BikeServiceTag,
  Effect.gen(function* () {
    const repo = yield* BikeRepository;

    const service: BikeService = {
      listBikes: (filter, pageReq) =>
        repo.listByStationWithOffset(filter.stationId, filter, pageReq),

      getBikeDetail: (bikeId: string) => repo.getById(bikeId),

      reportBrokenBike: (bikeId: string) =>
        repo.updateStatus(bikeId, "BROKEN" as BikeStatus),
    };

    return service;
  }),
);
