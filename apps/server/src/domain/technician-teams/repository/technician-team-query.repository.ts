import { Effect, Layer } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";

import type { TechnicianTeamQueryRepo } from "./technician-team.repository.types";

import { makeTechnicianTeamReadRepository } from "./read/technician-team.read.repository";

export type { TechnicianTeamQueryRepo } from "./technician-team.repository.types";

const makeTechnicianTeamQueryRepositoryEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  return makeTechnicianTeamQueryRepository(client);
});

export class TechnicianTeamQueryRepository extends Effect.Service<TechnicianTeamQueryRepository>()(
  "TechnicianTeamQueryRepository",
  {
    effect: makeTechnicianTeamQueryRepositoryEffect,
  },
) {}

export function makeTechnicianTeamQueryRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): TechnicianTeamQueryRepo {
  return makeTechnicianTeamReadRepository(client);
}

export const TechnicianTeamQueryRepositoryLive = Layer.effect(
  TechnicianTeamQueryRepository,
  makeTechnicianTeamQueryRepositoryEffect.pipe(Effect.map(TechnicianTeamQueryRepository.make)),
);
