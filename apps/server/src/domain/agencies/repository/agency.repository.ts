import { Effect, Layer } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";

import type { AgencyRepo } from "./agency.repository.types";

import { makeAgencyReadRepository } from "./read/agency.read.repository";
import { makeAgencyWriteRepository } from "./write/agency.write.repository";

const makeAgencyRepositoryEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  return makeAgencyRepository(client);
});

export class AgencyRepository extends Effect.Service<AgencyRepository>()(
  "AgencyRepository",
  {
    effect: makeAgencyRepositoryEffect,
  },
) {}

export function makeAgencyRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): AgencyRepo {
  return {
    ...makeAgencyReadRepository(client),
    ...makeAgencyWriteRepository(client),
  };
}

export const AgencyRepositoryLive = Layer.effect(
  AgencyRepository,
  makeAgencyRepositoryEffect.pipe(Effect.map(AgencyRepository.make)),
);

export type { AgencyRepo } from "./agency.repository.types";
