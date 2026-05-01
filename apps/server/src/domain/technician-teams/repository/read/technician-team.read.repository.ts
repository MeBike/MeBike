import { Effect, Option } from "effect";

import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { defectOn } from "@/domain/shared";
import { makePageResult, normalizedPage } from "@/domain/shared/pagination";
import { pickDefined } from "@/domain/shared/pick-defined";

import type { TechnicianTeamAvailableOption, TechnicianTeamDetailRow, TechnicianTeamRow } from "../../models";
import type { TechnicianTeamQueryRepo } from "../technician-team.repository.types";

import { TechnicianTeamRepositoryError } from "../../domain-errors";
import { TECHNICIAN_TEAM_MEMBER_LIMIT } from "../../models";

export function makeTechnicianTeamReadRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): TechnicianTeamQueryRepo {
  const mapRow = (row: {
    id: string;
    name: string;
    stationId: string;
    station: { name: string };
    availabilityStatus: import("generated/prisma/client").TechnicianTeamAvailability;
    createdAt: Date;
    updatedAt: Date;
    _count: { userAssignments: number };
  }): TechnicianTeamRow => ({
    id: row.id,
    name: row.name,
    stationId: row.stationId,
    stationName: row.station.name,
    availabilityStatus: row.availabilityStatus,
    memberCount: row._count.userAssignments,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });

  const mapDetailRow = (row: {
    id: string;
    name: string;
    stationId: string;
    station: { name: string; address: string };
    availabilityStatus: import("generated/prisma/client").TechnicianTeamAvailability;
    createdAt: Date;
    updatedAt: Date;
    _count: { userAssignments: number };
    userAssignments: ReadonlyArray<{
      user: {
        id: string;
        fullName: string;
        role: import("generated/prisma/client").UserRole;
      };
    }>;
  }): TechnicianTeamDetailRow => ({
    ...mapRow(row),
    stationAddress: row.station.address,
    members: row.userAssignments.map(assignment => ({
      userId: assignment.user.id,
      fullName: assignment.user.fullName,
      role: assignment.user.role,
    })),
  });

  return {
    getById: id =>
      Effect.tryPromise({
        try: () =>
          client.technicianTeam.findUnique({
            where: { id },
            select: {
              id: true,
              name: true,
              stationId: true,
              station: {
                select: {
                  name: true,
                },
              },
              availabilityStatus: true,
              createdAt: true,
              updatedAt: true,
              _count: {
                select: {
                  userAssignments: true,
                },
              },
            },
          }),
        catch: cause =>
          new TechnicianTeamRepositoryError({
            operation: "getById",
            cause,
          }),
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(
            Option.map(mapRow),
          ),
        ),
        defectOn(TechnicianTeamRepositoryError),
      ),

    getDetailById: id =>
      Effect.tryPromise({
        try: () =>
          client.technicianTeam.findUnique({
            where: { id },
            select: {
              id: true,
              name: true,
              stationId: true,
              station: {
                select: {
                  name: true,
                  address: true,
                },
              },
              availabilityStatus: true,
              createdAt: true,
              updatedAt: true,
              _count: {
                select: {
                  userAssignments: true,
                },
              },
              userAssignments: {
                select: {
                  user: {
                    select: {
                      id: true,
                      fullName: true,
                      role: true,
                    },
                  },
                },
              },
            },
          }),
        catch: cause =>
          new TechnicianTeamRepositoryError({
            operation: "getDetailById",
            cause,
          }),
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(
            Option.map(mapDetailRow),
          ),
        ),
        defectOn(TechnicianTeamRepositoryError),
      ),

    list: (filter, pageReq) =>
      Effect.gen(function* () {
        const { page, pageSize, skip, take } = normalizedPage(pageReq);
        const where = pickDefined({
          stationId: filter.stationId,
          availabilityStatus: filter.availabilityStatus,
        });

        const [total, rows] = yield* Effect.all([
          Effect.tryPromise({
            try: () =>
              client.technicianTeam.count({
                where,
              }),
            catch: cause =>
              new TechnicianTeamRepositoryError({
                operation: "list.count",
                cause,
              }),
          }),
          Effect.tryPromise({
            try: () =>
              client.technicianTeam.findMany({
                where,
                skip,
                take,
                orderBy: {
                  name: "asc",
                },
                select: {
                  id: true,
                  name: true,
                  stationId: true,
                  station: {
                    select: {
                      name: true,
                    },
                  },
                  availabilityStatus: true,
                  createdAt: true,
                  updatedAt: true,
                  _count: {
                    select: {
                      userAssignments: true,
                    },
                  },
                },
              }),
            catch: cause =>
              new TechnicianTeamRepositoryError({
                operation: "list.findMany",
                cause,
              }),
          }),
        ]);

        return makePageResult(rows.map(mapRow), total, page, pageSize);
      }).pipe(defectOn(TechnicianTeamRepositoryError)),

    listAvailable: args =>
      Effect.tryPromise({
        try: () =>
          client.technicianTeam.findMany({
            where: pickDefined({
              availabilityStatus: "AVAILABLE",
              stationId: args?.stationId,
            }),
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
        catch: cause =>
          new TechnicianTeamRepositoryError({
            operation: "listAvailable",
            cause,
          }),
      }).pipe(
        Effect.map(rows => rows
          .filter(row => row._count.userAssignments < TECHNICIAN_TEAM_MEMBER_LIMIT)
          .map((row): TechnicianTeamAvailableOption => ({
            id: row.id,
            name: row.name,
            stationId: row.stationId,
          }))),
        defectOn(TechnicianTeamRepositoryError),
      ),

    countMembers: (technicianTeamId, options) =>
      Effect.tryPromise({
        try: () =>
          client.userOrgAssignment.count({
            where: pickDefined({
              technicianTeamId,
              userId: options?.excludeUserId
                ? {
                    not: options.excludeUserId,
                  }
                : undefined,
            }),
          }),
        catch: cause =>
          new TechnicianTeamRepositoryError({
            operation: "countMembers",
            cause,
          }),
      }).pipe(defectOn(TechnicianTeamRepositoryError)),
  };
}
