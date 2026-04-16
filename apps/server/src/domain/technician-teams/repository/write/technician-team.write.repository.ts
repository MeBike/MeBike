import { Effect } from "effect";
import { uuidv7 } from "uuidv7";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
  TechnicianTeamAvailability,
} from "generated/prisma/client";

import { defectOn } from "@/domain/shared";
import { pickDefined } from "@/domain/shared/pick-defined";

import type { TechnicianTeamCommandRepo } from "../technician-team.repository.types";

import { TechnicianTeamRepositoryError } from "../../domain-errors";

const technicianTeamDetailSelect = {
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
} satisfies PrismaTypes.TechnicianTeamSelect;

function mapTechnicianTeamRow(row: {
  id: string;
  name: string;
  stationId: string;
  station: { name: string };
  availabilityStatus: TechnicianTeamAvailability;
  createdAt: Date;
  updatedAt: Date;
  _count: { userAssignments: number };
}) {
  return {
    id: row.id,
    name: row.name,
    stationId: row.stationId,
    stationName: row.station.name,
    availabilityStatus: row.availabilityStatus,
    memberCount: row._count.userAssignments,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

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
            select: technicianTeamDetailSelect,
          }),
        catch: cause =>
          new TechnicianTeamRepositoryError({
            operation: "create",
            cause,
          }),
      }).pipe(
        Effect.map(mapTechnicianTeamRow),
        defectOn(TechnicianTeamRepositoryError),
      ),

    update: (id, input) =>
      Effect.tryPromise({
        try: () =>
          client.technicianTeam.update({
            where: { id },
            data: pickDefined({
              name: input.name,
              availabilityStatus: input.availabilityStatus,
            }),
            select: technicianTeamDetailSelect,
          }),
        catch: cause =>
          new TechnicianTeamRepositoryError({
            operation: "update",
            cause,
          }),
      }).pipe(
        Effect.map(mapTechnicianTeamRow),
        defectOn(TechnicianTeamRepositoryError),
      ),
  };
}
