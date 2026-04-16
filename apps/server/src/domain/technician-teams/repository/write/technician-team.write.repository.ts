import { Effect } from "effect";
import { uuidv7 } from "uuidv7";

import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import type { TechnicianTeamCommandRepo } from "../technician-team.repository.types";

import { defectOn } from "@/domain/shared";

import { TechnicianTeamRepositoryError } from "../../domain-errors";

export function makeTechnicianTeamWriteRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): TechnicianTeamCommandRepo {
  return {
    create: input =>
      Effect.tryPromise({
        try: () =>
          client.technicianTeam.create({
            data: {
              id: uuidv7(),
              name: input.name,
              stationId: input.stationId,
              availabilityStatus: input.availabilityStatus,
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
            operation: "create",
            cause,
          }),
      }).pipe(
        Effect.map(row => ({
          id: row.id,
          name: row.name,
          stationId: row.stationId,
          stationName: row.station.name,
          availabilityStatus: row.availabilityStatus,
          memberCount: row._count.userAssignments,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        })),
        defectOn(TechnicianTeamRepositoryError),
      ),
  };
}
