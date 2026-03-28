import { Effect, Layer } from "effect";

import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";

import type { UserQueryRepo } from "./user.repository.types";

import { makeUserReadRepository } from "./read/user.read.repository";

export type { UserQueryRepo } from "./user.repository.types";

const makeUserQueryRepositoryEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  return makeUserQueryRepository(client);
});

export class UserQueryRepository extends Effect.Service<UserQueryRepository>()(
  "UserQueryRepository",
  {
    effect: makeUserQueryRepositoryEffect,
  },
) {}

export function makeUserQueryRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): UserQueryRepo {
  return makeUserReadRepository(client);
}

export const UserQueryRepositoryLive = Layer.effect(
  UserQueryRepository,
  makeUserQueryRepositoryEffect.pipe(Effect.map(UserQueryRepository.make)),
);
