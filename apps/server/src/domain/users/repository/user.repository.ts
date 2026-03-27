import { Effect, Layer } from "effect";

import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";

import type { UserRepo } from "./user.repository.types";

import { makeUserReadRepository } from "./read/user.read.repository";
import { makeUserWriteRepository } from "./write/user.write.repository";

export type { UserRepo } from "./user.repository.types";

const makeUserRepositoryEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  return makeUserRepository(client);
});

export class UserRepository extends Effect.Service<UserRepository>()(
  "UserRepository",
  {
    effect: makeUserRepositoryEffect,
  },
) {}

export function makeUserRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): UserRepo {
  return {
    ...makeUserReadRepository(client),
    ...makeUserWriteRepository(client),
  };
}

export const UserRepositoryLive = Layer.effect(
  UserRepository,
  makeUserRepositoryEffect.pipe(Effect.map(UserRepository.make)),
);
