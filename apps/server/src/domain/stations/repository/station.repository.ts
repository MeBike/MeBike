import { Effect, Layer } from "effect";

import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";

import type { StationRepo } from "./station.repository.types";

import {
  makeStationCommandRepository,
} from "./station-command.repository";
import {
  makeStationQueryRepository,
} from "./station-query.repository";

export { toStationOrderBy } from "./station-query.repository";
export type { StationRepo } from "./station.repository.types";

const makeStationRepositoryEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  return makeStationRepository(client);
});

export class StationRepository extends Effect.Service<StationRepository>()(
  "StationRepository",
  {
    effect: makeStationRepositoryEffect,
  },
) {}

export function makeStationRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): StationRepo {
  return {
    ...makeStationQueryRepository(client),
    ...makeStationCommandRepository(client),
  };
}

export const StationRepositoryLive = Layer.effect(
  StationRepository,
  makeStationRepositoryEffect.pipe(Effect.map(StationRepository.make)),
);

export const stationRepositoryFactory = makeStationRepository;
