import { Context, Effect, Layer, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";
import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";
import { IncidentStatus } from "generated/prisma/enums";

import { makePageResult, normalizedPage } from "@/domain/shared/pagination";
import { Prisma } from "@/infrastructure/prisma";

import { IncidentRepositoryError } from "../domain-errors";

import type {
  CreateIncidentInput,
  IncidentFilter,
  IncidentRow,
  IncidentSortField,
  UpdateIncidentInput,
} from "../models";
import { IncidentSeverity, IncidentSource } from "generated/kysely/types";

export type IncidentRepo = {
  listWithOffset: (
    filter: IncidentFilter,
    pageReq: PageRequest<IncidentSortField>,
  ) => Effect.Effect<PageResult<IncidentRow>>;

  getById: (id: string) => Effect.Effect<Option.Option<IncidentRow>>;

  create: (
    data: CreateIncidentInput,
  ) => Effect.Effect<IncidentRow, IncidentRepositoryError>;

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

export function makeIncidentRepository(client: PrismaClient): IncidentRepo {
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
        Effect.map((val) => Option.fromNullable(val as IncidentRow | null)),
      );
    },

    create(data) {
      return Effect.tryPromise({
        try: () =>
          client.incidentReport.create({
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
              status: IncidentStatus.OPEN,
            },
            select,
          }),
        catch: (err: any) =>
          new IncidentRepositoryError({
            operation: "create",
            cause: err,
            message: "Failed to create incident",
          }),
      });
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
            .then((val) => val as IncidentRow)
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
