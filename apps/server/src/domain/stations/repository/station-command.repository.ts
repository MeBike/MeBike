import { Effect, Layer } from "effect";

import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";

import type { StationCommandRepo } from "./station.repository.types";

import { makeStationWriteRepository } from "./write/station.write.repository";

export type { StationCommandRepo } from "./station.repository.types";

const makeStationCommandRepositoryEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  return makeStationCommandRepository(client);
});

export class StationCommandRepository extends Effect.Service<StationCommandRepository>()(
  "StationCommandRepository",
  {
    effect: makeStationCommandRepositoryEffect,
  },
) {}

export function makeStationCommandRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): StationCommandRepo {
  return makeStationWriteRepository(client);
}

export const StationCommandRepositoryLive = Layer.effect(
  StationCommandRepository,
  makeStationCommandRepositoryEffect.pipe(Effect.map(StationCommandRepository.make)),
);
