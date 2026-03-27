import { Effect, Option } from "effect";
import { uuidv7 } from "uuidv7";

import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { pickDefined } from "@/domain/shared/pick-defined";
import { isPrismaRecordNotFound, isPrismaUniqueViolation } from "@/infrastructure/prisma-errors";
import { UserRole, UserVerifyStatus } from "generated/prisma/client";

import type { UserRepo } from "../user.repository.types";

import {
  DuplicateUserEmail,
  DuplicateUserPhoneNumber,
  TechnicianTeamMemberLimitExceeded,
  UserRepositoryError,
} from "../../domain-errors";
import {
  isEmailTarget,
  isPhoneTarget,
  uniqueTargets,
} from "../unique-violation";
import { selectUserRow, toUserRow } from "../user.mappers";
import {
  ensureTechnicianTeamCapacity,
  toOrgAssignmentData,
} from "../user.repository.helpers";

export type UserWriteRepo = Pick<
  UserRepo,
  | "createUser"
  | "updateProfile"
  | "updateAdminById"
  | "updatePassword"
  | "markVerified"
  | "setStripeConnectedAccountId"
  | "setStripeConnectedAccountIdIfNull"
  | "setStripePayoutsEnabled"
  | "setStripePayoutsEnabledByAccountId"
>;

export function makeUserWriteRepository(
  db: PrismaClient | PrismaTypes.TransactionClient,
): UserWriteRepo {
  const client = db;

  const runInTransaction = <T>(
    operation: (tx: PrismaTypes.TransactionClient) => Promise<T>,
  ) => {
    if ("$transaction" in client) {
      return client.$transaction(operation);
    }
    return operation(client as PrismaTypes.TransactionClient);
  };

  return {
    createUser: data =>
      Effect.tryPromise({
        try: async () => {
          const orgAssignmentData = toOrgAssignmentData(data.orgAssignment);

          return runInTransaction(async (tx) => {
            if (orgAssignmentData?.technicianTeamId) {
              await ensureTechnicianTeamCapacity(tx, orgAssignmentData.technicianTeamId);
            }

            return tx.user.create({
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
          });
        },
        catch: (err) => {
          if (err instanceof TechnicianTeamMemberLimitExceeded) {
            return err;
          }

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
          return Option.none();
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
                  if (orgAssignmentData.technicianTeamId) {
                    await ensureTechnicianTeamCapacity(tx, orgAssignmentData.technicianTeamId, {
                      excludeUserId: id,
                    });
                  }

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
            if (err instanceof TechnicianTeamMemberLimitExceeded) {
              return err;
            }

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
          return Option.none();
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
          return Option.none();
        }

        const updated = yield* Effect.tryPromise({
          try: () =>
            client.user.update({
              where: { id },
              data: { passwordHash },
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
          catch: err =>
            new UserRepositoryError({
              operation: "markVerified",
              cause: err,
            }),
        });

        return Option.some(toUserRow(updated));
      }),

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

          if (updated.count === 0) {
            return null;
          }

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
  };
}
