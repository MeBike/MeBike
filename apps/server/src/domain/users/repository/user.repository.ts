import { Effect, Layer, Option } from "effect";

import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";
import { isPrismaUniqueViolation } from "@/infrastructure/prisma-errors";
import { UserRole, UserVerifyStatus } from "generated/prisma/client";

import type { PageRequest, PageResult } from "../../shared/pagination";
import type {
  CreateUserInput,
  UpdateUserAdminPatch,
  UpdateUserProfilePatch,
  UserFilter,
  UserOrderBy,
  UserRow,
  UserSortField,
} from "../models";

import { makePageResult, normalizedPage } from "../../shared/pagination";
import {
  DuplicateUserEmail,
  DuplicateUserPhoneNumber,
  UserRepositoryError,
} from "../domain-errors";
import {
  isEmailTarget,
  isPhoneTarget,
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
  readonly createUserInTx: (
    tx: PrismaTypes.TransactionClient,
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
  readonly updateAdminById: (
    id: string,
    patch: UpdateUserAdminPatch,
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
  readonly listWithOffset: (
    filter: UserFilter,
    pageReq: PageRequest<UserSortField>,
  ) => Effect.Effect<PageResult<UserRow>, UserRepositoryError>;
  readonly searchByQuery: (
    query: string,
  ) => Effect.Effect<readonly UserRow[], UserRepositoryError>;
};

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

export function makeUserRepository(client: PrismaClient): UserRepo {
  const toOrderBy = (
    pageReq: PageRequest<UserSortField>,
  ): UserOrderBy => {
    const sortBy = pageReq.sortBy ?? "fullname";
    const sortDir = pageReq.sortDir ?? "asc";
    switch (sortBy) {
      case "email":
        return { email: sortDir };
      case "role":
        return { role: sortDir };
      case "verify":
        return { verify: sortDir };
      case "updatedAt":
        return { updatedAt: sortDir };
      case "fullname":
      default:
        return { fullname: sortDir };
    }
  };

  const toWhere = (filter: UserFilter) => ({
    ...(filter.fullname
      ? { fullname: { contains: filter.fullname, mode: "insensitive" as const } }
      : {}),
    ...(filter.email
      ? { email: { contains: filter.email, mode: "insensitive" as const } }
      : {}),
    ...(filter.verify ? { verify: filter.verify } : {}),
    ...(filter.role ? { role: filter.role } : {}),
  });

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
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(toUserRow)),
        ),
      ),

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
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(toUserRow)),
        ),
      ),

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

    createUserInTx: (tx, data) =>
      Effect.tryPromise({
        try: () =>
          tx.user.create({
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
            operation: "createUserInTx",
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

    updateAdminById: (id, patch) =>
      Effect.gen(function* () {
        const existing = yield* Effect.tryPromise({
          try: () =>
            client.user.findUnique({
              where: { id },
              select: { id: true, phoneNumber: true },
            }),
          catch: err =>
            new UserRepositoryError({
              operation: "updateAdminById.findExisting",
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
                ...(patch.email !== undefined ? { email: patch.email } : {}),
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
              if (targets.some(isEmailTarget)) {
                return new DuplicateUserEmail({
                  email: patch.email ?? "unknown",
                });
              }
              if (targets.some(isPhoneTarget)) {
                return new DuplicateUserPhoneNumber({
                  phoneNumber: patch.phoneNumber ?? existing.phoneNumber ?? "unknown",
                });
              }
            }
            return new UserRepositoryError({
              operation: "updateAdminById",
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

    listWithOffset: (filter, pageReq) =>
      Effect.gen(function* () {
        const { page, pageSize, skip, take } = normalizedPage(pageReq);
        const where = toWhere(filter);
        const orderBy = toOrderBy(pageReq);

        const [total, items] = yield* Effect.all([
          Effect.tryPromise({
            try: () => client.user.count({ where }),
            catch: err =>
              new UserRepositoryError({
                operation: "listWithOffset.count",
                cause: err,
              }),
          }),
          Effect.tryPromise({
            try: () =>
              client.user.findMany({
                where,
                skip,
                take,
                orderBy,
                select: selectUserRow,
              }),
            catch: err =>
              new UserRepositoryError({
                operation: "listWithOffset.findMany",
                cause: err,
              }),
          }),
        ]);

        return makePageResult(
          items.map(toUserRow),
          total,
          page,
          pageSize,
        );
      }),

    searchByQuery: query =>
      Effect.tryPromise({
        try: () =>
          client.user.findMany({
            where: {
              OR: [
                { email: { contains: query, mode: "insensitive" } },
                { phoneNumber: { contains: query } },
              ],
            },
            select: selectUserRow,
          }),
        catch: err =>
          new UserRepositoryError({
            operation: "searchByQuery",
            cause: err,
          }),
      }).pipe(Effect.map(rows => rows.map(toUserRow))),
  };
}

export const UserRepositoryLive = Layer.effect(
  UserRepository,
  makeUserRepositoryEffect.pipe(Effect.map(UserRepository.make)),
);
