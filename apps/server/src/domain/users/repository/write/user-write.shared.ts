import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { isPrismaUniqueViolation } from "@/infrastructure/prisma-errors";

import {
  DuplicateUserEmail,
  DuplicateUserPhoneNumber,
  UserRepositoryError,
} from "../../domain-errors";
import {
  isEmailTarget,
  isPhoneTarget,
  uniqueTargets,
} from "../unique-violation";

export type UserWriteClient = PrismaClient | PrismaTypes.TransactionClient;

export function runInTransaction<T>(
  client: UserWriteClient,
  operation: (tx: PrismaTypes.TransactionClient) => Promise<T>,
) {
  if ("$transaction" in client) {
    return client.$transaction(operation);
  }

  return operation(client as PrismaTypes.TransactionClient);
}

export function mapDuplicateUserWriteError(
  err: unknown,
  args: {
    email?: string | null;
    phoneNumber?: string | null;
  },
) {
  if (!isPrismaUniqueViolation(err)) {
    return null;
  }

  const targets = uniqueTargets(err);

  if (args.email && targets.some(isEmailTarget)) {
    return new DuplicateUserEmail({ email: args.email });
  }

  if (targets.some(isPhoneTarget)) {
    return new DuplicateUserPhoneNumber({
      phoneNumber: args.phoneNumber ?? "unknown",
    });
  }

  return null;
}

export function toUserRepositoryError(operation: string, cause: unknown) {
  return new UserRepositoryError({ operation, cause });
}
