import { Effect } from "effect";

import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { pickDefined } from "@/domain/shared/pick-defined";

import type { PageRequest } from "../../shared/pagination";
import type {
  CreateUserInput,
  UpdateUserAdminPatch,
  UserFilter,
  UserOrderBy,
  UserSortField,
} from "../models";

import { TechnicianTeamMemberLimitExceeded, UserRepositoryError } from "../domain-errors";

export const TECHNICIAN_TEAM_MEMBER_LIMIT = 3;

export function toOrgAssignmentData(
  assignment:
    | CreateUserInput["orgAssignment"]
    | UpdateUserAdminPatch["orgAssignment"]
    | undefined,
) {
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
}

export function toOrderBy(
  pageReq: PageRequest<UserSortField>,
): UserOrderBy {
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
}

export function toWhere(filter: UserFilter): PrismaTypes.UserWhereInput {
  const orgAssignment = pickDefined({
    stationId: filter.stationId,
    agencyId: filter.agencyId,
    technicianTeamId: filter.technicianTeamId,
  }, { returnUndefinedIfEmpty: true });
  const roles = filter.roles?.length
    ? [...new Set(filter.roles)]
    : filter.role
      ? [filter.role]
      : undefined;
  const role = roles?.length
    ? roles.length === 1
      ? roles[0]
      : { in: roles }
    : undefined;

  return pickDefined({
    fullName: filter.fullname
      ? { contains: filter.fullname, mode: "insensitive" as const }
      : undefined,
    email: filter.email
      ? { contains: filter.email, mode: "insensitive" as const }
      : undefined,
    accountStatus: filter.accountStatus,
    verifyStatus: filter.verify,
    role,
    orgAssignment: orgAssignment
      ? {
          is: orgAssignment,
        }
      : undefined,
  });
}

export function countTechnicianTeamMembersForClient(
  client: PrismaClient | PrismaTypes.TransactionClient,
  technicianTeamId: string,
  options?: { readonly excludeUserId?: string },
) {
  return Effect.tryPromise({
    try: () =>
      client.userOrgAssignment.count({
        where: {
          technicianTeamId,
          ...(options?.excludeUserId
            ? {
                userId: {
                  not: options.excludeUserId,
                },
              }
            : {}),
        },
      }),
    catch: err =>
      new UserRepositoryError({
        operation: "countTechnicianTeamMembers",
        cause: err,
      }),
  });
}

export async function ensureTechnicianTeamCapacity(
  client: PrismaTypes.TransactionClient,
  technicianTeamId: string,
  options?: { readonly excludeUserId?: string },
) {
  const memberCount = await client.userOrgAssignment.count({
    where: {
      technicianTeamId,
      ...(options?.excludeUserId
        ? {
            userId: {
              not: options.excludeUserId,
            },
          }
        : {}),
    },
  });

  if (memberCount >= TECHNICIAN_TEAM_MEMBER_LIMIT) {
    throw new TechnicianTeamMemberLimitExceeded({
      technicianTeamId,
      memberLimit: TECHNICIAN_TEAM_MEMBER_LIMIT,
    });
  }
}
