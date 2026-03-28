import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";
import { uniqueEmail } from "@/test/scenarios";

import type { CreateUserInput } from "../../models";
import type { UserRepo } from "../user.repository.types";

import { makeUserCommandRepository } from "../user-command.repository";
import { makeUserQueryRepository } from "../user-query.repository";

type UserRepoClient = PrismaClient | PrismaTypes.TransactionClient;

export function createUserInput(overrides: Partial<CreateUserInput> = {}): CreateUserInput {
  return {
    fullname: overrides.fullname ?? "Test User",
    email: overrides.email ?? uniqueEmail("user"),
    passwordHash: overrides.passwordHash ?? "hash",
    phoneNumber: overrides.phoneNumber ?? null,
    username: overrides.username,
    avatar: overrides.avatar,
    location: overrides.location,
    role: overrides.role,
    accountStatus: overrides.accountStatus,
    verify: overrides.verify,
    orgAssignment: overrides.orgAssignment,
    nfcCardUid: overrides.nfcCardUid,
  };
}

export function setupUserRepositoryIntTestKit() {
  const fixture = setupPrismaIntFixture();

  return {
    fixture,
    makeRepo: (client: UserRepoClient = fixture.prisma): UserRepo => ({
      ...makeUserQueryRepository(client),
      ...makeUserCommandRepository(client),
    }),
  };
}
