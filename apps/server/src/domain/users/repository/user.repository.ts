import { Effect, Layer, Option } from "effect";
import { uuidv7 } from "uuidv7";

import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { pickDefined } from "@/domain/shared/pick-defined";
import { Prisma } from "@/infrastructure/prisma";
import { isPrismaRecordNotFound, isPrismaUniqueViolation } from "@/infrastructure/prisma-errors";
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
  readonly findByStripeConnectedAccountId: (
    accountId: string,
  ) => Effect.Effect<Option.Option<UserRow>, UserRepositoryError>;
  readonly setStripeConnectedAccountId: (
    id: string,
    accountId: string,
  ) => Effect.Effect<Option.Option<UserRow>, UserRepositoryError>;
  readonly setStripeConnectedAccountIdIfNull: (
    id: string,
    accountId: string,
  ) => Effect.Effect<Option.Option<UserRow>, UserRepositoryError>;
  readonly setStripePayoutsEnabled: (
    id: string,
    enabled: boolean,
  ) => Effect.Effect<Option.Option<UserRow>, UserRepositoryError>;
  readonly setStripePayoutsEnabledByAccountId: (
    accountId: string,
    enabled: boolean,
  ) => Effect.Effect<boolean, UserRepositoryError>;
  readonly listWithOffset: (
    filter: UserFilter,
    pageReq: PageRequest<UserSortField>,
  ) => Effect.Effect<PageResult<UserRow>, UserRepositoryError>;
  readonly searchByQuery: (
    query: string,
  ) => Effect.Effect<readonly UserRow[], UserRepositoryError>;
  readonly listTechnicianSummaries: () => Effect.Effect<
    readonly Pick<UserRow, "id" | "fullname">[],
    UserRepositoryError
  >;
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

export function makeUserRepository(
  db: PrismaClient | PrismaTypes.TransactionClient,
): UserRepo {
  const client = db;

  const runInTransaction = <T>(
    operation: (tx: PrismaTypes.TransactionClient) => Promise<T>,
  ) => {
    if ("$transaction" in client) {
      return client.$transaction(operation);
    }
    return operation(client as PrismaTypes.TransactionClient);
  };

  const toOrgAssignmentData = (
    assignment:
      | CreateUserInput["orgAssignment"]
      | UpdateUserAdminPatch["orgAssignment"]
      | undefined,
  ) => {
    if (!assignment) {
      return null;
    }

    const stationId = assignment.stationId ?? null;
    const agencyId = assignment.agencyId ?? null;
    const technicianTeamId = assignment.technicianTeamId ?? null;

    if (stationId === null && agencyId === null && technicianTeamId === null) {
      return null;
    }

    return {
      stationId,
      agencyId,
      technicianTeamId,
    };
  };

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
      case "accountStatus":
        return { accountStatus: sortDir };
      case "verify":
        return { verifyStatus: sortDir };
      case "updatedAt":
        return { updatedAt: sortDir };
      case "fullname":
      default:
        return { fullName: sortDir };
    }
  };

  const toWhere = (filter: UserFilter): PrismaTypes.UserWhereInput => {
    const orgAssignment = pickDefined({
      stationId: filter.stationId,
      agencyId: filter.agencyId,
      technicianTeamId: filter.technicianTeamId,
    });
    const roles = filter.roles?.length
      ? [...new Set(filter.roles)]
      : filter.role
        ? [filter.role]
        : undefined;

    return {
      ...(filter.fullname
        ? { fullName: { contains: filter.fullname, mode: "insensitive" as const } }
        : {}),
      ...(filter.email
        ? { email: { contains: filter.email, mode: "insensitive" as const } }
        : {}),
      ...(filter.accountStatus ? { accountStatus: filter.accountStatus } : {}),
      ...(filter.verify ? { verifyStatus: filter.verify } : {}),
      ...(roles?.length
        ? {
            role: roles.length === 1
              ? roles[0]
              : { in: roles },
          }
        : {}),
      ...(Object.keys(orgAssignment).length
        ? {
            orgAssignment: {
              is: orgAssignment,
            },
          }
        : {}),
    };
  };

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
        try: async () => {
          const orgAssignmentData = toOrgAssignmentData(data.orgAssignment);

          return client.user.create({
            data: {
              fullName: data.fullname,
              email: data.email,
              passwordHash: data.passwordHash,
              phoneNumber: data.phoneNumber ?? null,
              username: data.username ?? null,
              avatarUrl: data.avatar ?? null,
              locationText: data.location ?? null,
              role: data.role ?? UserRole.USER,
              accountStatus: data.accountStatus ?? "ACTIVE",
              verifyStatus: data.verify ?? UserVerifyStatus.UNVERIFIED,
              ...(orgAssignmentData
                ? {
                    orgAssignment: {
                      create: orgAssignmentData,
                    },
                  }
                : {}),
              nfcCardUid: data.nfcCardUid ?? null,
            },
            select: selectUserRow,
          });
        },
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
          try: async () => {
            const orgAssignmentData = toOrgAssignmentData(patch.orgAssignment);

            return runInTransaction(async (tx) => {
              await tx.user.update({
                where: { id },
                data: pickDefined({
                  fullName: patch.fullname,
                  email: patch.email,
                  phoneNumber: patch.phoneNumber,
                  username: patch.username,
                  avatarUrl: patch.avatar,
                  locationText: patch.location,
                  role: patch.role,
                  accountStatus: patch.accountStatus,
                  verifyStatus: patch.verify,
                  nfcCardUid: patch.nfcCardUid,
                }),
              });

              if (patch.orgAssignment !== undefined) {
                if (orgAssignmentData === null) {
                  await tx.userOrgAssignment.deleteMany({
                    where: { userId: id },
                  });
                }
                else {
                  await tx.userOrgAssignment.upsert({
                    where: { userId: id },
                    create: {
                      id: uuidv7(),
                      userId: id,
                      stationId: orgAssignmentData.stationId,
                      agencyId: orgAssignmentData.agencyId,
                      technicianTeamId: orgAssignmentData.technicianTeamId,
                    },
                    update: {
                      stationId: orgAssignmentData.stationId,
                      agencyId: orgAssignmentData.agencyId,
                      technicianTeamId: orgAssignmentData.technicianTeamId,
                    },
                  });
                }
              }

              return tx.user.findUnique({
                where: { id },
                select: selectUserRow,
              });
            });
          },
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

        if (!updated) {
          return Option.none<UserRow>();
        }

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
                verifyStatus: UserVerifyStatus.VERIFIED,
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

    findByStripeConnectedAccountId: accountId =>
      Effect.tryPromise({
        try: () =>
          client.user.findUnique({
            where: { stripeConnectedAccountId: accountId },
            select: selectUserRow,
          }),
        catch: err =>
          new UserRepositoryError({
            operation: "findByStripeConnectedAccountId",
            cause: err,
          }),
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(toUserRow)),
        ),
      ),

    setStripeConnectedAccountId: (id, accountId) =>
      Effect.tryPromise({
        try: () =>
          client.user.update({
            where: { id },
            data: {
              stripeConnectedAccountId: accountId,
            },
            select: selectUserRow,
          }),
        catch: err => err as unknown,
      }).pipe(
        Effect.catchAll((err) => {
          if (isPrismaRecordNotFound(err)) {
            return Effect.succeed(null);
          }
          return Effect.fail(new UserRepositoryError({
            operation: "setStripeConnectedAccountId",
            cause: err,
          }));
        }),
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(toUserRow)),
        ),
      ),

    setStripeConnectedAccountIdIfNull: (id, accountId) =>
      Effect.tryPromise({
        try: async () => {
          const updated = await client.user.updateMany({
            where: {
              id,
              stripeConnectedAccountId: null,
            },
            data: {
              stripeConnectedAccountId: accountId,
            },
          });
          if (updated.count === 0)
            return null;
          return client.user.findUnique({
            where: { id },
            select: selectUserRow,
          });
        },
        catch: err => err as unknown,
      }).pipe(
        Effect.catchAll(err =>
          Effect.fail(new UserRepositoryError({
            operation: "setStripeConnectedAccountIdIfNull",
            cause: err,
          })),
        ),
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(toUserRow)),
        ),
      ),

    setStripePayoutsEnabled: (id, enabled) =>
      Effect.tryPromise({
        try: () =>
          client.user.update({
            where: { id },
            data: {
              stripePayoutsEnabled: enabled,
            },
            select: selectUserRow,
          }),
        catch: err => err as unknown,
      }).pipe(
        Effect.catchAll((err) => {
          if (isPrismaRecordNotFound(err)) {
            return Effect.succeed(null);
          }
          return Effect.fail(new UserRepositoryError({
            operation: "setStripePayoutsEnabled",
            cause: err,
          }));
        }),
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(toUserRow)),
        ),
      ),

    setStripePayoutsEnabledByAccountId: (accountId, enabled) =>
      Effect.tryPromise({
        try: async () => {
          const updated = await client.user.updateMany({
            where: { stripeConnectedAccountId: accountId },
            data: { stripePayoutsEnabled: enabled },
          });
          return updated.count > 0;
        },
        catch: err =>
          new UserRepositoryError({
            operation: "setStripePayoutsEnabledByAccountId",
            cause: err,
          }),
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

    listTechnicianSummaries: () =>
      Effect.tryPromise({
        try: () =>
          client.user.findMany({
            where: {
              role: UserRole.TECHNICIAN,
            },
            orderBy: {
              fullName: "asc",
            },
            select: {
              id: true,
              fullName: true,
            },
          }),
        catch: err =>
          new UserRepositoryError({
            operation: "listTechnicianSummaries",
            cause: err,
          }),
      }).pipe(
        Effect.map(rows => rows.map(row => ({
          id: row.id,
          fullname: row.fullName,
        }))),
      ),
  };
}

export const UserRepositoryLive = Layer.effect(
  UserRepository,
  makeUserRepositoryEffect.pipe(Effect.map(UserRepository.make)),
);
