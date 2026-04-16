import { Effect, Layer } from "effect";

import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";

import type { StationQueryRepo } from "./station.repository.types";

import { makeStationReadRepository } from "./read/station.read.repository";

export { toStationOrderBy } from "./station.repository.helpers";
export type { StationQueryRepo } from "./station.repository.types";

const makeStationQueryRepositoryEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  return makeStationQueryRepository(client);
});

export class StationQueryRepository extends Effect.Service<StationQueryRepository>()(
  "StationQueryRepository",
  {
    effect: makeStationQueryRepositoryEffect,
  },
) {}

export function makeStationQueryRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): StationQueryRepo {
  return makeStationReadRepository(client);
}

export const StationQueryRepositoryLive = Layer.effect(
  StationQueryRepository,
  makeStationQueryRepositoryEffect.pipe(Effect.map(StationQueryRepository.make)),
);
