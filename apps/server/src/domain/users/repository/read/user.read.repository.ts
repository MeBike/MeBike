import { Effect, Option } from "effect";

import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { defectOn } from "@/domain/shared";
import { UserRole } from "generated/prisma/client";

import type { TechnicianTeamAvailableOption } from "../../models";
import type { UserRepo } from "../user.repository.types";

import { makePageResult, normalizedPage } from "../../../shared/pagination";
import { UserRepositoryError } from "../../domain-errors";
import { selectUserRow, toUserRow } from "../user.mappers";
import {
  countStationRoleAssignmentsForClient,
  countTechnicianTeamMembersForClient,
  TECHNICIAN_TEAM_MEMBER_LIMIT,
  toOrderBy,
  toWhere,
} from "../user.repository.helpers";

export type UserReadRepo = Pick<
  UserRepo,
  | "findById"
  | "findByEmail"
  | "findByStripeConnectedAccountId"
  | "listWithOffset"
  | "searchByQuery"
  | "listTechnicianSummaries"
  | "listAvailableTechnicianTeams"
  | "countTechnicianTeamMembers"
  | "countStationRoleAssignments"
>;

export function makeUserReadRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): UserReadRepo {
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
        defectOn(UserRepositoryError),
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
        defectOn(UserRepositoryError),
      ),

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
        defectOn(UserRepositoryError),
      ),

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
      }).pipe(defectOn(UserRepositoryError)),

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
      }).pipe(
        Effect.map(rows => rows.map(toUserRow)),
        defectOn(UserRepositoryError),
      ),

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
        defectOn(UserRepositoryError),
      ),

    listAvailableTechnicianTeams: args =>
      Effect.tryPromise({
        try: () =>
          client.technicianTeam.findMany({
            where: {
              availabilityStatus: "AVAILABLE",
              ...(args?.stationId ? { stationId: args.stationId } : {}),
            },
            orderBy: {
              name: "asc",
            },
            select: {
              id: true,
              name: true,
              stationId: true,
              _count: {
                select: {
                  userAssignments: true,
                },
              },
            },
          }),
        catch: err =>
          new UserRepositoryError({
            operation: "listAvailableTechnicianTeams",
            cause: err,
          }),
      }).pipe(
        Effect.map(rows => rows
          .filter(row => row._count.userAssignments < TECHNICIAN_TEAM_MEMBER_LIMIT)
          .map((row): TechnicianTeamAvailableOption => ({
            id: row.id,
            name: row.name,
            stationId: row.stationId,
          }))),
        defectOn(UserRepositoryError),
      ),

    countTechnicianTeamMembers: (technicianTeamId, options) =>
      countTechnicianTeamMembersForClient(client, technicianTeamId, options).pipe(
        defectOn(UserRepositoryError),
      ),

    countStationRoleAssignments: (stationId, role, options) =>
      countStationRoleAssignmentsForClient(client, stationId, role, options).pipe(
        defectOn(UserRepositoryError),
      ),
  };
}
