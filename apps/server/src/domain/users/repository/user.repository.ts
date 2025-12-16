import { Context, Effect, Layer, Option } from "effect";

import { Prisma } from "@/infrastructure/prisma";

import type { PrismaClient } from "../../../../generated/prisma/client";
import type {
  CreateUserInput,
  UpdateUserProfilePatch,
  UserRow,
} from "../models";

import { UserRole, UserVerifyStatus } from "../../../../generated/prisma/enums";
import {
  DuplicateUserEmail,
  DuplicateUserPhoneNumber,
  UserRepositoryError,
} from "../domain-errors";
import {
  isEmailTarget,
  isPhoneTarget,
  isPrismaUniqueViolation,
  uniqueTargets,
} from "./unique-violation";
import { selectUserRow, toUserRow } from "./user.mappers";

export type UserRepo = {
  readonly findById: (
    id: string,
  ) => Effect.Effect<Option.Option<UserRow>, UserRepositoryError>;
  readonly findByEmail: (
    email: string,
  ) => Effect.Effect<Option.Option<UserRow>, UserRepositoryError>;
  readonly createUser: (
    data: CreateUserInput,
  ) => Effect.Effect<
    UserRow,
    UserRepositoryError | DuplicateUserEmail | DuplicateUserPhoneNumber
  >;
  readonly updateProfile: (
    id: string,
    patch: UpdateUserProfilePatch,
  ) => Effect.Effect<
    Option.Option<UserRow>,
    UserRepositoryError | DuplicateUserEmail | DuplicateUserPhoneNumber
  >;
  readonly updatePassword: (
    id: string,
    passwordHash: string,
  ) => Effect.Effect<Option.Option<UserRow>, UserRepositoryError>;
  readonly markVerified: (
    id: string,
  ) => Effect.Effect<Option.Option<UserRow>, UserRepositoryError>;
};

export class UserRepository extends Context.Tag("UserRepository")<
  UserRepository,
  UserRepo
>() {}

export function makeUserRepository(client: PrismaClient): UserRepo {
  return {
    findById: id =>
      Effect.tryPromise({
        try: () =>
          client.user.findUnique({
            where: { id },
            select: selectUserRow,
          }),
        catch: err =>
          new UserRepositoryError({
            operation: "findById",
            cause: err,
          }),
      }).pipe(Effect.map(row => Option.fromNullable(row ? toUserRow(row) : null))),

    findByEmail: email =>
      Effect.tryPromise({
        try: () =>
          client.user.findUnique({
            where: { email },
            select: selectUserRow,
          }),
        catch: err =>
          new UserRepositoryError({
            operation: "findByEmail",
            cause: err,
          }),
      }).pipe(Effect.map(row => Option.fromNullable(row ? toUserRow(row) : null))),

    createUser: data =>
      Effect.tryPromise({
        try: () =>
          client.user.create({
            data: {
              fullname: data.fullname,
              email: data.email,
              passwordHash: data.passwordHash,
              phoneNumber: data.phoneNumber ?? null,
              username: data.username ?? null,
              avatar: data.avatar ?? null,
              location: data.location ?? null,
              role: data.role ?? UserRole.USER,
              verify: data.verify ?? UserVerifyStatus.UNVERIFIED,
              nfcCardUid: data.nfcCardUid ?? null,
            },
            select: selectUserRow,
          }),
        catch: (err) => {
          if (isPrismaUniqueViolation(err)) {
            const targets = uniqueTargets(err);
            if (targets.some(isEmailTarget)) {
              return new DuplicateUserEmail({ email: data.email });
            }

            if (targets.some(isPhoneTarget)) {
              return new DuplicateUserPhoneNumber({
                phoneNumber: data.phoneNumber ?? "unknown",
              });
            }
          }
          return new UserRepositoryError({
            operation: "createUser",
            cause: err,
          });
        },
      }).pipe(Effect.map(toUserRow)),

    updateProfile: (id, patch) =>
      Effect.gen(function* () {
        const existing = yield* Effect.tryPromise({
          try: () =>
            client.user.findUnique({
              where: { id },
              select: { id: true, phoneNumber: true },
            }),
          catch: err =>
            new UserRepositoryError({
              operation: "updateProfile.findExisting",
              cause: err,
            }),
        });
        if (!existing) {
          return Option.none<UserRow>();
        }

        const updated = yield* Effect.tryPromise({
          try: () =>
            client.user.update({
              where: { id },
              data: {
                ...(patch.fullname !== undefined ? { fullname: patch.fullname } : {}),
                ...(patch.phoneNumber !== undefined
                  ? { phoneNumber: patch.phoneNumber }
                  : {}),
                ...(patch.username !== undefined ? { username: patch.username } : {}),
                ...(patch.avatar !== undefined ? { avatar: patch.avatar } : {}),
                ...(patch.location !== undefined ? { location: patch.location } : {}),
                ...(patch.role !== undefined ? { role: patch.role } : {}),
                ...(patch.verify !== undefined ? { verify: patch.verify } : {}),
                ...(patch.nfcCardUid !== undefined
                  ? { nfcCardUid: patch.nfcCardUid }
                  : {}),
              },
              select: selectUserRow,
            }),
          catch: (err) => {
            if (isPrismaUniqueViolation(err)) {
              const targets = uniqueTargets(err);

              if (targets.some(isPhoneTarget)) {
                return new DuplicateUserPhoneNumber({
                  phoneNumber: patch.phoneNumber ?? existing.phoneNumber ?? "unknown",
                });
              }
            }
            return new UserRepositoryError({
              operation: "updateProfile",
              cause: err,
            });
          },
        });

        return Option.some(toUserRow(updated));
      }),

    updatePassword: (id, passwordHash) =>
      Effect.gen(function* () {
        const existing = yield* Effect.tryPromise({
          try: () => client.user.findUnique({ where: { id }, select: { id: true } }),
          catch: err =>
            new UserRepositoryError({
              operation: "updatePassword.findExisting",
              cause: err,
            }),
        });
        if (!existing) {
          return Option.none<UserRow>();
        }

        const updated = yield* Effect.tryPromise({
          try: () =>
            client.user.update({
              where: { id },
              data: {
                passwordHash,
              },
              select: selectUserRow,
            }),
          catch: err =>
            new UserRepositoryError({
              operation: "updatePassword",
              cause: err,
            }),
        });

        return Option.some(toUserRow(updated));
      }),

    markVerified: id =>
      Effect.gen(function* () {
        const existing = yield* Effect.tryPromise({
          try: () => client.user.findUnique({ where: { id }, select: { id: true } }),
          catch: err =>
            new UserRepositoryError({
              operation: "markVerified.findExisting",
              cause: err,
            }),
        });
        if (!existing) {
          return Option.none<UserRow>();
        }

        const updated = yield* Effect.tryPromise({
          try: () =>
            client.user.update({
              where: { id },
              data: {
                verify: UserVerifyStatus.VERIFIED,
              },
              select: selectUserRow,
            }),
          catch: err =>
            new UserRepositoryError({
              operation: "markVerified",
              cause: err,
            }),
        });

        return Option.some(toUserRow(updated));
      }),
  };
}

export const UserRepositoryLive = Layer.effect(
  UserRepository,
  Effect.gen(function* () {
    const { client } = yield* Prisma;
    return makeUserRepository(client);
  }),
);
