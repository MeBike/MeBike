import { Context, Effect, Layer, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";
import type { IncidentSeverity, IncidentSource } from "generated/kysely/types";
import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";
import type { IncidentStatus } from "generated/prisma/enums";

import { makePageResult, normalizedPage } from "@/domain/shared/pagination";
import { stationRepositoryFactory } from "@/domain/stations";
import { Prisma } from "@/infrastructure/prisma";

import type {
  NoNearestStationFound,
} from "../domain-errors";
import type {
  CreateIncidentInput,
  IncidentFilter,
  IncidentRow,
  IncidentSortField,
  UpdateIncidentInput,
} from "../models";

import {
  IncidentRepositoryError,
} from "../domain-errors";

export type IncidentRepo = {
  listWithOffset: (
    filter: IncidentFilter,
    pageReq: PageRequest<IncidentSortField>,
  ) => Effect.Effect<PageResult<IncidentRow>>;

  getById: (id: string) => Effect.Effect<Option.Option<IncidentRow>>;

  create: (
    data: CreateIncidentInput,
  ) => Effect.Effect<
    IncidentRow,
    IncidentRepositoryError | NoNearestStationFound
  >;

  update: (
    id: string,
    patch: UpdateIncidentInput,
  ) => Effect.Effect<Option.Option<IncidentRow>, IncidentRepositoryError>;

  updateStatus: (
    id: string,
    status: IncidentStatus,
  ) => Effect.Effect<Option.Option<IncidentRow>, IncidentRepositoryError>;
};

function toIncidentOrderBy(
  req: PageRequest<IncidentSortField>,
): PrismaTypes.IncidentReportOrderByWithRelationInput {
  const sortBy = req.sortBy ?? "resolvedAt";
  const sortDir = req.sortDir ?? "asc";

  switch (sortBy) {
    case "status":
      return { status: sortDir };
    case "resolvedAt":
      return { resolvedAt: sortDir };
    default:
      return { resolvedAt: sortDir };
  }
}

function createIncidentWithClient(tx: PrismaClient | PrismaTypes.TransactionClient, data: CreateIncidentInput) {
  return Effect.tryPromise({
    try: async () => {
      const select = {
        id: true,
        reporterUserId: true,
        rentalId: true,
        bikeId: true,
        stationId: true,
        source: true,
        incidentType: true,
        severity: true,
        description: true,
        latitude: true,
        longitude: true,
        bikeLocked: true,
        status: true,
        reportedAt: true,
        resolvedAt: true,
        closedAt: true,
      } as const;

      let foundTechnician:
        | { userId: string; technicianTeamId: string }
        | undefined;

      if (data.latitude && data.longitude) {
        const stationRepo = stationRepositoryFactory(tx);
        const nearestStation = await Effect.runPromise(
          stationRepo.listNearest({
            latitude: Number(data.latitude),
            longitude: Number(data.longitude),
            maxDistanceMeters: 5000,
            pageSize: 10,
          }),
        );

        for (const station of nearestStation.items) {
          const technician = await tx.userOrgAssignment.findFirst({
            where: {
              stationId: station.id,
              technicianTeam: { availabilityStatus: "AVAILABLE" },
            },
            select: { userId: true, technicianTeamId: true },
          });

          if (technician && technician.technicianTeamId) {
            foundTechnician = {
              userId: technician.userId,
              technicianTeamId: technician.technicianTeamId,
            };
            break;
          }
        }
      }
      else if (data.stationId) {
        const technician = await tx.userOrgAssignment.findFirst({
          where: {
            stationId: data.stationId!,
            technicianTeam: { availabilityStatus: "AVAILABLE" },
          },
          select: { userId: true, technicianTeamId: true },
        });

        if (technician && technician.technicianTeamId) {
          foundTechnician = {
            userId: technician.userId,
            technicianTeamId: technician.technicianTeamId,
          };
        }
      }

      const incident = await tx.incidentReport.create({
        data: {
          reporterUserId: data.reporterUserId,
          rentalId: data.rentalId,
          bikeId: data.bikeId,
          stationId: data.stationId,
          source: data.source as IncidentSource,
          incidentType: data.incidentType,
          severity: data.severity as IncidentSeverity,
          description: data.description,
          latitude: data.latitude,
          longitude: data.longitude,
          bikeLocked: data.bikeLocked,
          status: (foundTechnician ? "ASSIGNED" : "OPEN") as IncidentStatus,
          attachments: {
            create: data.fileUrls.map(url => ({ fileUrl: url })),
          },
        },
        select,
      });

      if (foundTechnician) {
        await tx.technicianAssignment.create({
          data: {
            incidentReportId: incident.id,
            technicianTeamId: foundTechnician.technicianTeamId,
            technicianUserId: foundTechnician.userId,
          },
        });
      }

      return incident as IncidentRow;
    },
    catch: e =>
      new IncidentRepositoryError({
        operation: "createIncidentWithClient",
        cause: e,
      }),
  });
}

export function makeIncidentRepository(
  db: PrismaClient | PrismaTypes.TransactionClient,
): IncidentRepo {
  const client = db;

  const select = {
    id: true,
    reporterUserId: true,
    rentalId: true,
    bikeId: true,
    stationId: true,
    source: true,
    incidentType: true,
    severity: true,
    description: true,
    latitude: true,
    longitude: true,
    bikeLocked: true,
    status: true,
    reportedAt: true,
    resolvedAt: true,
    closedAt: true,
  } as const;

  return {
    listWithOffset(filter, pageReq) {
      return Effect.gen(function* () {
        const { page, pageSize, skip, take } = normalizedPage(pageReq);

        const where: PrismaTypes.IncidentReportWhereInput = {
          ...(filter.stationId && { stationId: filter.stationId }),
          ...(filter.status && { status: filter.status }),
        };

        const orderBy = toIncidentOrderBy(pageReq);

        const [total, items] = yield* Effect.all([
          Effect.promise(() => client.incidentReport.count({ where })),
          Effect.promise(() =>
            client.incidentReport.findMany({
              where,
              skip,
              take,
              orderBy,
              select,
            }),
          ),
        ]);

        return makePageResult(items as IncidentRow[], total, page, pageSize);
      });
    },

    getById(id) {
      return Effect.promise(() =>
        client.incidentReport.findUnique({ where: { id }, select }),
      ).pipe(
        Effect.map(val => Option.fromNullable(val as IncidentRow | null)),
      );
    },

    create(data: CreateIncidentInput) {
      return createIncidentWithClient(client, data);
    },

    update(id, patch) {
      return Effect.gen(function* () {
        const existing = yield* Effect.promise(() =>
          client.incidentReport.findUnique({ where: { id }, select }),
        );
        if (!existing) {
          return Option.none<IncidentRow>();
        }

        const updated = yield* Effect.tryPromise({
          try: () =>
            client.incidentReport.update({
              where: { id },
              data: {
                ...(patch.bikeId !== undefined ? { bikeId: patch.bikeId } : {}),
                ...(patch.stationId !== undefined
                  ? { stationId: patch.stationId }
                  : {}),
                ...(patch.source !== undefined ? { source: patch.source } : {}),
                ...(patch.incidentType !== undefined
                  ? { incidentType: patch.incidentType }
                  : {}),
                ...(patch.severity !== undefined
                  ? { severity: patch.severity }
                  : {}),
                ...(patch.description !== undefined
                  ? { description: patch.description }
                  : {}),
                ...(patch.latitude !== undefined
                  ? { latitude: patch.latitude }
                  : {}),
                ...(patch.longitude !== undefined
                  ? { longitude: patch.longitude }
                  : {}),
                ...(patch.bikeLocked !== undefined
                  ? { bikeLocked: patch.bikeLocked }
                  : {}),
                ...(patch.bikeLocked !== undefined
                  ? { bikeLocked: patch.bikeLocked }
                  : {}),
              } as PrismaTypes.IncidentReportUncheckedUpdateInput,
              select,
            }),
          catch: (err: any) =>
            new IncidentRepositoryError({
              operation: "update",
              cause: err,
              message: "Failed to update incident",
            }),
        });

        return Option.some(updated);
      });
    },

    updateStatus(id, status) {
      return Effect.tryPromise({
        try: () =>
          client.incidentReport
            .update({
              where: { id },
              data: { status },
              select,
            })
            .then(val => val as IncidentRow)
            .then(Option.some),
        catch: (err: any) => new IncidentRepositoryError(err),
      });
    },
  };
}

export class IncidentRepository extends Context.Tag("IncidentRepository")<
  IncidentRepository,
  IncidentRepo
>() {}

export const IncidentRepositoryLive = Layer.effect(
  IncidentRepository,
  Effect.gen(function* () {
    const { client } = yield* Prisma;
    return makeIncidentRepository(client);
  }),
);

export { toIncidentOrderBy };
