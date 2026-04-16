import { Effect, Layer } from "effect";

import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";

import type { TechnicianTeamCommandRepo } from "./technician-team.repository.types";

import { makeTechnicianTeamWriteRepository } from "./write/technician-team.write.repository";

export type { TechnicianTeamCommandRepo } from "./technician-team.repository.types";

const makeTechnicianTeamCommandRepositoryEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  return makeTechnicianTeamCommandRepository(client);
});

export class TechnicianTeamCommandRepository extends Effect.Service<TechnicianTeamCommandRepository>()(
  "TechnicianTeamCommandRepository",
  {
    effect: makeTechnicianTeamCommandRepositoryEffect,
  },
) {}

export function makeTechnicianTeamCommandRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): TechnicianTeamCommandRepo {
  return makeTechnicianTeamWriteRepository(client);
}

export const TechnicianTeamCommandRepositoryLive = Layer.effect(
  TechnicianTeamCommandRepository,
  makeTechnicianTeamCommandRepositoryEffect.pipe(
    Effect.map(TechnicianTeamCommandRepository.make),
  ),
);
