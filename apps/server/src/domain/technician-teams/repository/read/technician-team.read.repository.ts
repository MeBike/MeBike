import { Effect, Option } from "effect";

import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { defectOn } from "@/domain/shared";
import { pickDefined } from "@/domain/shared/pick-defined";

import type { TechnicianTeamAvailableOption, TechnicianTeamRow } from "../../models";
import type { TechnicianTeamQueryRepo } from "../technician-team.repository.types";

import { TechnicianTeamRepositoryError } from "../../domain-errors";
import {
  TECHNICIAN_TEAM_MEMBER_LIMIT,

} from "../../models";

export function makeTechnicianTeamReadRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): TechnicianTeamQueryRepo {
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
              availabilityStatus: true,
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
            Option.map((item): TechnicianTeamRow => ({
              id: item.id,
              name: item.name,
              stationId: item.stationId,
              availabilityStatus: item.availabilityStatus,
            })),
          ),
        ),
        defectOn(TechnicianTeamRepositoryError),
      ),

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
