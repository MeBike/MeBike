import { Context, Effect, Layer, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";
import type {
  AssignmentStatus,
  IncidentSeverity,
  IncidentSource,
  IncidentStatus,
  UserRole,
} from "generated/kysely/types";
import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { makePageResult, normalizedPage } from "@/domain/shared/pagination";
import { stationRepositoryFactory } from "@/domain/stations";
import { Prisma } from "@/infrastructure/prisma";
import { runPrismaTransaction } from "@/lib/effect/prisma-tx";

import type {
  IncidentNotFound,
  InvalidIncidentStatus,
  UnauthorizedIncidentAccess,
} from "../domain-errors";
import type {
  CreateIncidentInput,
  IncidentDetail,
  IncidentFilter,
  IncidentRow,
  IncidentSortField,
  TechnicianAssignmentRow,
  UpdateIncidentInput,
} from "../models";

import {
  ActiveIncidentAlreadyExists,
  IncidentRepositoryError,
  NoAvailableTechnicianFound,
  NoNearestStationFound,
} from "../domain-errors";
import {
  incidentDetailSelect,
  mapToIncidentDetail,
  technicianAssignmentDetailSelect,
} from "./incident.repository.query";
import { isPrismaUniqueViolation } from "@/infrastructure/prisma-errors";

export type IncidentRepo = {
  listWithOffset: (
    role: UserRole,
    filter: IncidentFilter,
    pageReq: PageRequest<IncidentSortField>,
  ) => Effect.Effect<PageResult<IncidentDetail>>;

  getById: (id: string) => Effect.Effect<Option.Option<IncidentDetail>>;

  create: (
    data: CreateIncidentInput,
  ) => Effect.Effect<
    IncidentRow,
    | IncidentRepositoryError
    | NoNearestStationFound
    | NoAvailableTechnicianFound
    | ActiveIncidentAlreadyExists
  >;

  update: (
    id: string,
    patch: UpdateIncidentInput,
  ) => Effect.Effect<Option.Option<IncidentDetail>, IncidentRepositoryError>;

  updateStatus: (
    id: string,
    status: IncidentStatus,
  ) => Effect.Effect<
    Option.Option<IncidentDetail>,
    IncidentRepositoryError | InvalidIncidentStatus
  >;

  acceptIncident: (
    id: string,
  ) => Effect.Effect<
    Option.Option<TechnicianAssignmentRow>,
    IncidentNotFound | IncidentRepositoryError | UnauthorizedIncidentAccess
  >;

  rejectIncident: (
    id: string,
  ) => Effect.Effect<
    Option.Option<TechnicianAssignmentRow>,
    | IncidentNotFound
    | IncidentRepositoryError
    | UnauthorizedIncidentAccess
    | NoNearestStationFound
    | NoAvailableTechnicianFound
  >;

  updateAssignmentStatus: (
    incidentId: string,
    status: AssignmentStatus,
  ) => Effect.Effect<void, IncidentRepositoryError>;

  getStationIdByTechnicianId: (
    userId: string,
  ) => Effect.Effect<string | undefined, IncidentRepositoryError>;
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

function createIncidentWithClient(
  tx: PrismaClient | PrismaTypes.TransactionClient,
  data: CreateIncidentInput,
) {
  return Effect.gen(function* () {
    let foundTechnician:
      | { userId: string; technicianTeamId: string }
      | undefined;

    if (data.latitude && data.longitude) {
      const stationRepo = stationRepositoryFactory(tx);
      const nearestStation = yield* stationRepo
        .listNearest({
          latitude: Number(data.latitude),
          longitude: Number(data.longitude),
          maxDistanceMeters: 5000,
          pageSize: 10,
        })
        .pipe(
          Effect.mapError(
            (e) =>
              new IncidentRepositoryError({
                operation: "createIncidentWithClient.listNearest",
                cause: e,
              }),
          ),
        );

      if (nearestStation.total === 0) {
        return yield* Effect.fail(
          new NoNearestStationFound({
            latitude: Number(data.latitude),
            longitude: Number(data.longitude),
          }),
        );
      }

      for (const station of nearestStation.items) {
        // Count Available Bikes of this station
        const countAvailableBikes = yield* Effect.promise(() =>
          tx.bike.count({
            where: {
              stationId: station.id,
              status: "AVAILABLE",
            },
          }),
        );

        if (countAvailableBikes === 0) {
          continue;
        }

        // Find Available Technician of this station
        const technician = yield* Effect.promise(() =>
          tx.userOrgAssignment.findFirst({
            where: {
              technicianTeam: {
                availabilityStatus: "AVAILABLE",
                stationId: station.id,
              },
            },
            select: { userId: true, technicianTeamId: true },
          }),
        );

        if (technician && technician.technicianTeamId) {
          foundTechnician = {
            userId: technician.userId,
            technicianTeamId: technician.technicianTeamId,
          };
          break;
        }
      }

      if (!foundTechnician) {
        return yield* Effect.fail(
          new NoAvailableTechnicianFound({
            latitude: Number(data.latitude),
            longitude: Number(data.longitude),
          }),
        );
      }
    } else if (data.stationId) {
      const technician = yield* Effect.promise(() =>
        tx.userOrgAssignment.findFirst({
          where: {
            stationId: data.stationId!,
            technicianTeam: { availabilityStatus: "AVAILABLE" },
          },
          select: { userId: true, technicianTeamId: true },
        }),
      );

      if (technician && technician.technicianTeamId) {
        foundTechnician = {
          userId: technician.userId,
          technicianTeamId: technician.technicianTeamId,
        };
      }
    }

    const incident = yield* Effect.tryPromise({
      try: () =>
        tx.incidentReport.create({
          data: {
            reporterUserId: data.reporterUserId,
            rentalId: data.rentalId,
            bikeId: data.bikeId || "",
            stationId: data.stationId,
            source: data.source as IncidentSource,
            incidentType: data.incidentType,
            severity: data.severity as IncidentSeverity,
            description: data.description,
            latitude: data.latitude,
            longitude: data.longitude,
            bikeLocked: data.bikeLocked,
            status: (foundTechnician ? "ASSIGNED" : "OPEN") as any,
            attachments: {
              create: data.fileUrls.map((url) => ({ fileUrl: url })),
            },
          },
        }),
      catch: (e) => {
        if (isPrismaUniqueViolation(e)) {
          return new ActiveIncidentAlreadyExists({
            bikeId: data.bikeId,
            rentalId: data.rentalId ?? undefined,
            stationId: data.stationId ?? undefined,
          });
        }

        return new IncidentRepositoryError({
          operation: "createIncidentWithClient",
          cause: e,
        });
      },
    });

    if (foundTechnician) {
      yield* Effect.tryPromise({
        try: () =>
          tx.technicianAssignment.create({
            data: {
              incidentReportId: incident.id,
              technicianTeamId: foundTechnician!.technicianTeamId,
              technicianUserId: foundTechnician!.userId,
            },
          }),
        catch: (e) =>
          new IncidentRepositoryError({
            operation: "createIncidentWithClient.assignTechnician",
            cause: e,
          }),
      });
    }

    return incident as IncidentRow;
  });
}

function rejectIncidentWithClient(
  tx: PrismaClient | PrismaTypes.TransactionClient,
  id: string,
) {
  return Effect.gen(function* () {
    const assignment = yield* Effect.promise(() =>
      tx.technicianAssignment.findFirst({
        where: { incidentReportId: id, status: "ASSIGNED" },
        select: { id: true, incidentReportId: true, technicianUserId: true },
      }),
    );
    const foundIncident = yield* Effect.promise(() =>
      tx.incidentReport.findFirst({
        where: { id: assignment?.incidentReportId },
      }),
    );

    if (!assignment || !foundIncident) {
      return Option.none();
    }

    const stationRepo = stationRepositoryFactory(tx);
    let foundTechnician:
      | { userId: string; technicianTeamId: string }
      | undefined;

    const nearestStation = yield* stationRepo
      .listNearest({
        latitude: Number(foundIncident.latitude),
        longitude: Number(foundIncident.longitude),
        maxDistanceMeters: 5000,
        pageSize: 10,
      })
      .pipe(
        Effect.mapError(
          (e) =>
            new IncidentRepositoryError({
              operation: "createIncidentWithClient.listNearest",
              cause: e,
            }),
        ),
      );

    if (nearestStation.total === 0) {
      return yield* Effect.fail(
        new NoNearestStationFound({
          latitude: Number(foundIncident.latitude),
          longitude: Number(foundIncident.longitude),
        }),
      );
    }

    for (const station of nearestStation.items) {
      // Count Available Bikes of this station
      const countAvailableBikes = yield* Effect.promise(() =>
        tx.bike.count({
          where: {
            stationId: station.id,
            status: "AVAILABLE",
          },
        }),
      );

      if (countAvailableBikes === 0) {
        continue;
      }

      // Find Available Technician of this station
      const technician = yield* Effect.promise(() =>
        tx.userOrgAssignment.findFirst({
          where: {
            stationId: station.id,
            technicianTeam: { availabilityStatus: "AVAILABLE" },
            userId: {
              not: assignment.technicianUserId!,
            },
          },
          select: { userId: true, technicianTeamId: true },
        }),
      );

      if (technician && technician.technicianTeamId) {
        foundTechnician = {
          userId: technician.userId,
          technicianTeamId: technician.technicianTeamId,
        };
        break;
      }
    }

    if (!foundTechnician) {
      return yield* Effect.fail(
        new NoAvailableTechnicianFound({
          latitude: Number(foundIncident.latitude),
          longitude: Number(foundIncident.longitude),
        }),
      );
    }

    yield* Effect.tryPromise({
      try: () =>
        tx.technicianAssignment.update({
          where: { id: assignment.id },
          data: {
            status: "CANCELLED",
          },
        }),
      catch: (e) =>
        new IncidentRepositoryError({
          operation: "rejectIncidentWithClient",
          cause: e,
        }),
    });

    const newAssignment = yield* Effect.promise(() =>
      tx.technicianAssignment.create({
        data: {
          incidentReportId: assignment.incidentReportId,
          technicianTeamId: foundTechnician!.technicianTeamId,
          technicianUserId: foundTechnician!.userId,
        },
      }),
    );

    return Option.some(newAssignment);
  });
}

export function makeIncidentRepository(
  db: PrismaClient | PrismaTypes.TransactionClient,
): IncidentRepo {
  const client = db;

  return {
    listWithOffset(role, filter, pageReq) {
      return Effect.gen(function* () {
        const { page, pageSize, skip, take } = normalizedPage(pageReq);

        const where: PrismaTypes.IncidentReportWhereInput = {
          ...(filter.stationId && { stationId: filter.stationId }),
          ...(filter.status && { status: filter.status }),
          ...(filter.userId && {
            OR: [
              { reporterUserId: filter.userId },
              ...(role === "TECHNICIAN"
                ? [
                    {
                      assignments: {
                        some: {
                          technicianUserId: filter.userId,
                        },
                      },
                    },
                  ]
                : []),
            ],
          }),
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
              select: incidentDetailSelect,
            }),
          ),
        ]);

        return makePageResult(
          (items as any[]).map(mapToIncidentDetail),
          total,
          page,
          pageSize,
        );
      });
    },

    getById(id) {
      return Effect.promise(() =>
        client.incidentReport.findUnique({
          where: { id },
          select: incidentDetailSelect,
        }),
      ).pipe(
        Effect.map((val) =>
          Option.fromNullable(val).pipe(Option.map(mapToIncidentDetail)),
        ),
      );
    },

    create(data: CreateIncidentInput) {
      return runPrismaTransaction(client as PrismaClient, (tx) =>
        createIncidentWithClient(tx, data),
      ).pipe(
        Effect.catchTag("PrismaTransactionError", (e) =>
          Effect.fail(
            new IncidentRepositoryError({
              operation: "create.transaction",
              cause: e.cause,
            }),
          ),
        ),
      );
    },

    update(id, patch) {
      return Effect.gen(function* () {
        const updated = yield* Effect.tryPromise({
          try: () =>
            client.incidentReport.update({
              where: { id },
              data: {
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
              },
              select: incidentDetailSelect,
            }),
          catch: (e) =>
            new IncidentRepositoryError({
              operation: "updateIncident.update",
              cause: e,
            }),
        });

        return Option.some(mapToIncidentDetail(updated));
      });
    },

    updateStatus(id, status) {
      return Effect.gen(function* () {
        const updated = yield* Effect.tryPromise({
          try: () =>
            client.incidentReport.update({
              where: { id },
              data: {
                status,
                ...(status === "RESOLVED" ? { resolvedAt: new Date() } : {}),
                ...(status === "CLOSED" ? { closedAt: new Date() } : {}),
              },
              select: incidentDetailSelect,
            }),
          catch: (e) =>
            new IncidentRepositoryError({
              operation: "updateStatus",
              cause: e,
            }),
        });

        return Option.some(mapToIncidentDetail(updated));
      });
    },

    acceptIncident(id) {
      return Effect.gen(function* () {
        const assignment = yield* Effect.promise(() =>
          client.technicianAssignment.findFirst({
            where: { incidentReportId: id, status: "ASSIGNED" },
            select: { id: true },
          }),
        );

        if (!assignment) {
          return Option.none();
        }

        const updated = yield* Effect.tryPromise({
          try: () =>
            client.technicianAssignment.update({
              where: { id: assignment.id },
              data: { status: "ACCEPTED", acceptedAt: new Date() },
              select: technicianAssignmentDetailSelect,
            }),
          catch: (e) =>
            new IncidentRepositoryError({
              operation: "acceptIncident",
              cause: e,
            }),
        });

        return Option.some(updated);
      });
    },

    rejectIncident(id) {
      return runPrismaTransaction(client as PrismaClient, (tx) =>
        rejectIncidentWithClient(tx, id),
      ).pipe(
        Effect.map((opt) =>
          Option.map(opt, (a) => a as TechnicianAssignmentRow),
        ),
        Effect.catchTag("PrismaTransactionError", (e) =>
          Effect.fail(
            new IncidentRepositoryError({
              operation: "rejectIncident.transaction",
              cause: e.cause,
            }),
          ),
        ),
      );
    },

    updateAssignmentStatus(incidentId, status) {
      return Effect.gen(function* () {
        const assignment = yield* Effect.promise(() =>
          client.technicianAssignment.findFirst({
            where: {
              incidentReportId: incidentId,
              status: { not: "CANCELLED" },
            },
            select: { id: true },
          }),
        );

        if (!assignment) {
          return;
        }

        yield* Effect.tryPromise({
          try: () =>
            client.technicianAssignment.update({
              where: { id: assignment.id },
              data: {
                status,
                ...(status === "IN_PROGRESS" ? { startedAt: new Date() } : {}),
                ...(status === "RESOLVED" ? { resolvedAt: new Date() } : {}),
              },
            }),
          catch: (e) =>
            new IncidentRepositoryError({
              operation: "updateAssignmentStatus",
              cause: e,
            }),
        });
      });
    },

    getStationIdByTechnicianId: (userId: string) =>
      Effect.gen(function* () {
        const assignment = yield* Effect.tryPromise({
          try: () =>
            client.userOrgAssignment.findFirst({
              where: {
                userId,
                technicianTeam: { availabilityStatus: "AVAILABLE" },
              },
              select: { technicianTeam: { select: { stationId: true } } },
            }),
          catch: (e) =>
            new IncidentRepositoryError({
              operation: "getStationIdByTechnicianId",
              cause: e,
            }),
        });
        return assignment?.technicianTeam?.stationId;
      }),
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
