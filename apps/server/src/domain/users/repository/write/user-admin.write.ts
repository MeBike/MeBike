import { Effect, Option } from "effect";
import { uuidv7 } from "uuidv7";

import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { defectOn } from "@/domain/shared";
import { pickDefined } from "@/domain/shared/pick-defined";
import { UserRole as PrismaUserRole, UserVerifyStatus } from "generated/prisma/client";

import type { UserRepo } from "../user.repository.types";

import {
  StationRoleAssignmentLimitExceeded,
  TechnicianTeamMemberLimitExceeded,
  UserRepositoryError,
} from "../../domain-errors";
import { selectUserRow, toUserRow } from "../user.mappers";
import {
  ensureStationRoleAssignmentLimit,
  ensureTechnicianTeamCapacity,
  toOrgAssignmentData,
} from "../user.repository.helpers";
import {
  mapDuplicateUserWriteError,
  runInTransaction,
  toUserRepositoryError,
} from "./user-write.shared";

export type UserAdminWriteRepo = Pick<
  UserRepo,
  "createUser" | "updateAdminById"
>;

export function makeUserAdminWriteRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): UserAdminWriteRepo {
  const findExistingAdminUser = (id: string) =>
    Effect.tryPromise({
      try: () =>
        client.user.findUnique({
          where: { id },
          select: {
            id: true,
            phoneNumber: true,
            role: true,
            orgAssignment: {
              select: {
                stationId: true,
              },
            },
          },
        }),
      catch: err => toUserRepositoryError("updateAdminById.findExisting", err),
    });

  return {
    createUser: data =>
      Effect.tryPromise({
        try: async () => {
          const orgAssignmentData = toOrgAssignmentData(data.orgAssignment);
          const role = data.role ?? PrismaUserRole.USER;

          return runInTransaction(client, async (tx) => {
            if (orgAssignmentData?.stationId && (role === PrismaUserRole.STAFF || role === PrismaUserRole.MANAGER)) {
              await ensureStationRoleAssignmentLimit(tx, orgAssignmentData.stationId, role);
            }

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
                role,
                accountStatus: data.accountStatus ?? "ACTIVE",
                verifyStatus: data.verify ?? UserVerifyStatus.UNVERIFIED,
                ...(orgAssignmentData
                  ? {
                      orgAssignment: {
                        create: orgAssignmentData,
                      },
                    }
                  : {}),
              },
              select: selectUserRow,
            });
          });
        },
        catch: (err) => {
          if (err instanceof TechnicianTeamMemberLimitExceeded || err instanceof StationRoleAssignmentLimitExceeded) {
            return err;
          }

          return mapDuplicateUserWriteError(err, {
            email: data.email,
            phoneNumber: data.phoneNumber,
          }) ?? toUserRepositoryError("createUser", err);
        },
      }).pipe(
        Effect.map(toUserRow),
        defectOn(UserRepositoryError),
      ),

    updateAdminById: (id, patch) =>
      Effect.gen(function* () {
        const existing = yield* findExistingAdminUser(id);

        if (!existing) {
          return Option.none();
        }

        const updated = yield* Effect.tryPromise({
          try: async () => {
            const orgAssignmentData = toOrgAssignmentData(patch.orgAssignment);

            return runInTransaction(client, async (tx) => {
              const nextRole = patch.role ?? existing.role;
              const nextStationId = patch.orgAssignment === undefined
                ? (existing.orgAssignment?.stationId ?? null)
                : (orgAssignmentData?.stationId ?? null);

              if (nextStationId && (nextRole === PrismaUserRole.STAFF || nextRole === PrismaUserRole.MANAGER)) {
                await ensureStationRoleAssignmentLimit(tx, nextStationId, nextRole, {
                  excludeUserId: id,
                });
              }

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
            if (err instanceof TechnicianTeamMemberLimitExceeded || err instanceof StationRoleAssignmentLimitExceeded) {
              return err;
            }

            return mapDuplicateUserWriteError(err, {
              email: patch.email,
              phoneNumber: patch.phoneNumber ?? existing.phoneNumber,
            }) ?? toUserRepositoryError("updateAdminById", err);
          },
        });

        if (!updated) {
          return Option.none();
        }

        return Option.some(toUserRow(updated));
      }).pipe(defectOn(UserRepositoryError)),
  };
}
