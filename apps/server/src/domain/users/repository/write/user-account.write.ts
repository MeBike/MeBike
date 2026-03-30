import { Effect, Option } from "effect";

import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { pickDefined } from "@/domain/shared/pick-defined";
import { UserVerifyStatus } from "generated/prisma/client";

import type { UserRepo } from "../user.repository.types";

import { selectUserRow, toUserRow } from "../user.mappers";
import {
  mapDuplicateUserWriteError,
  toUserRepositoryError,
} from "./user-write.shared";

export type UserAccountWriteRepo = Pick<
  UserRepo,
  "createRegisteredUser" | "updateProfile" | "updatePassword" | "markVerified"
>;

export function makeUserAccountWriteRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): UserAccountWriteRepo {
  const findExistingUserContact = (id: string, operation: string) =>
    Effect.tryPromise({
      try: () =>
        client.user.findUnique({
          where: { id },
          select: {
            id: true,
            phoneNumber: true,
          },
        }),
      catch: err => toUserRepositoryError(operation, err),
    });

  const findExistingUserId = (id: string, operation: string) =>
    Effect.tryPromise({
      try: () => client.user.findUnique({ where: { id }, select: { id: true } }),
      catch: err => toUserRepositoryError(operation, err),
    });

  return {
    createRegisteredUser: data =>
      Effect.tryPromise({
        try: () =>
          client.user.create({
            data: {
              fullName: data.fullname,
              email: data.email,
              passwordHash: data.passwordHash,
              phoneNumber: data.phoneNumber ?? null,
            },
            select: selectUserRow,
          }),
        catch: err =>
          mapDuplicateUserWriteError(err, {
            email: data.email,
            phoneNumber: data.phoneNumber,
          }) ?? toUserRepositoryError("createRegisteredUser", err),
      }).pipe(Effect.map(toUserRow)),

    updateProfile: (id, patch) =>
      Effect.gen(function* () {
        const existing = yield* findExistingUserContact(id, "updateProfile.findExisting");

        if (!existing) {
          return Option.none();
        }

        const updated = yield* Effect.tryPromise({
          try: () =>
            client.user.update({
              where: { id },
              data: pickDefined({
                fullName: patch.fullname,
                phoneNumber: patch.phoneNumber,
                username: patch.username,
                avatarUrl: patch.avatar,
                locationText: patch.location,
                role: patch.role,
                accountStatus: patch.accountStatus,
                verifyStatus: patch.verify,
                nfcCardUid: patch.nfcCardUid,
              }),
              select: selectUserRow,
            }),
          catch: err =>
            mapDuplicateUserWriteError(err, {
              phoneNumber: patch.phoneNumber ?? existing.phoneNumber,
            }) ?? toUserRepositoryError("updateProfile", err),
        });

        return Option.some(toUserRow(updated));
      }),

    updatePassword: (id, passwordHash) =>
      Effect.gen(function* () {
        const existing = yield* findExistingUserId(id, "updatePassword.findExisting");

        if (!existing) {
          return Option.none();
        }

        const updated = yield* Effect.tryPromise({
          try: () =>
            client.user.update({
              where: { id },
              data: { passwordHash },
              select: selectUserRow,
            }),
          catch: err => toUserRepositoryError("updatePassword", err),
        });

        return Option.some(toUserRow(updated));
      }),

    markVerified: id =>
      Effect.gen(function* () {
        const existing = yield* findExistingUserId(id, "markVerified.findExisting");

        if (!existing) {
          return Option.none();
        }

        const updated = yield* Effect.tryPromise({
          try: () =>
            client.user.update({
              where: { id },
              data: {
                verifyStatus: UserVerifyStatus.VERIFIED,
              },
              select: selectUserRow,
            }),
          catch: err => toUserRepositoryError("markVerified", err),
        });

        return Option.some(toUserRow(updated));
      }),
  };
}
