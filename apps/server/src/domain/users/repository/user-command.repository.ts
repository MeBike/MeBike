import { Effect, Layer } from "effect";

import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";

import type { UserCommandRepo } from "./user.repository.types";

import { makeUserWriteRepository } from "./write/user.write.repository";

export type { UserCommandRepo } from "./user.repository.types";

const makeUserCommandRepositoryEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  return makeUserCommandRepository(client);
});

export class UserCommandRepository extends Effect.Service<UserCommandRepository>()(
  "UserCommandRepository",
  {
    effect: makeUserCommandRepositoryEffect,
  },
) {}

export function makeUserCommandRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): UserCommandRepo {
  return makeUserWriteRepository(client);
}

export const UserCommandRepositoryLive = Layer.effect(
  UserCommandRepository,
  makeUserCommandRepositoryEffect.pipe(Effect.map(UserCommandRepository.make)),
);
