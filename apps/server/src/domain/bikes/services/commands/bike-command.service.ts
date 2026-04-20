import { Effect, Layer, Option } from "effect";

import { Prisma } from "@/infrastructure/prisma";

import type { BikeRepo } from "../../repository/bike.repository";
import type { BikeService } from "./bike-command.service.types";

import {
  BikeNotFound,
  InvalidBikeStatus,
} from "../../domain-errors";
import { BikeRepository } from "../../repository/bike.repository";
import { createBikeWithGuards } from "./bike-command.create";
import { getScopedStatusTransitions } from "./bike-command.helpers";
import { adminUpdateBikeWithGuards } from "./bike-command.update";

function makeBikeService(
  repo: BikeRepo,
  client: import("generated/prisma/client").PrismaClient,
): BikeService {
  return {
    createBike: input => createBikeWithGuards(client, input),

    listBikes: (filter, pageReq) =>
      repo.listByStationWithOffset(filter.stationId, filter, pageReq),

    getBikeDetail: (bikeId: string) =>
      repo.getById(bikeId),

    adminUpdateBike: (bikeId, patch) =>
      adminUpdateBikeWithGuards(client, bikeId, patch),

    updateBikeStatusInStationScope: (bikeId, input) =>
      Effect.gen(function* () {
        const current = yield* repo.getById(bikeId);

        if (Option.isNone(current) || current.value.stationId !== input.stationId) {
          return yield* Effect.fail(new BikeNotFound({ id: bikeId }));
        }

        const allowed = getScopedStatusTransitions(current.value.status);
        if (!allowed.includes(input.status)) {
          return yield* Effect.fail(new InvalidBikeStatus({
            status: input.status,
            allowed,
          }));
        }

        const updated = yield* repo.transitionStatusInStationAt(
          bikeId,
          input.stationId,
          current.value.status,
          input.status,
          new Date(),
        );

        if (Option.isSome(updated)) {
          return updated.value;
        }

        const latest = yield* repo.getById(bikeId);
        if (Option.isNone(latest) || latest.value.stationId !== input.stationId) {
          return yield* Effect.fail(new BikeNotFound({ id: bikeId }));
        }

        return yield* Effect.fail(new InvalidBikeStatus({
          status: input.status,
          allowed: getScopedStatusTransitions(latest.value.status),
        }));
      }),

  };
}

const makeBikeServiceEffect = Effect.gen(function* () {
  const repo = yield* BikeRepository;
  const { client } = yield* Prisma;
  return makeBikeService(repo, client);
});

export class BikeServiceTag extends Effect.Service<BikeServiceTag>()(
  "BikeService",
  {
    effect: makeBikeServiceEffect,
  },
) {}

export const BikeServiceLive = Layer.effect(
  BikeServiceTag,
  makeBikeServiceEffect.pipe(Effect.map(BikeServiceTag.make)),
);
