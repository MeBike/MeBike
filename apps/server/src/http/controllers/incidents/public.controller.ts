import { RouteHandler } from "@hono/zod-openapi";
import {
  IncidentErrorCodeSchema,
  incidentErrorMessages,
  IncidentNotFoundResponse,
  IncidentRoutes,
  IncidentSummary,
} from "./shared";
import { withLoggedCause } from "@/domain/shared";
import { Effect, Match, Option } from "effect";
import { IncidentServiceTag } from "@/domain/incident";
import { IncidentStatus } from "generated/kysely/types";
import { IncidentListResponse } from "@mebike/shared";
import { toIncidentSummary } from "@/http/presenters/incidents.presenter";
import { Prisma } from "generated/prisma/client";

const listIncidents: RouteHandler<IncidentRoutes["listIncidents"]> = async (
  c,
) => {
  const query = c.req.valid("query");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* IncidentServiceTag;
      return yield* service.listIncidents(
        {
          stationId: query.stationId,
          status: query.status as IncidentStatus,
        },
        {
          page: query.page ?? 1,
          pageSize: query.pageSize ?? 50,
          sortBy: query.sortBy ?? "resolvedAt",
          sortDir: query.sortDir ?? "asc",
        },
      );
    }),
    "GET /v1/incidents",
  );

  const value = await c.var.runPromise(eff);
  return c.json<IncidentListResponse, 200>(
    {
      data: value.items.map(toIncidentSummary),
      pagination: {
        page: value.page,
        pageSize: value.pageSize,
        total: value.total,
        totalPages: value.totalPages,
      },
    },
    200,
  );
};

const getIncident: RouteHandler<IncidentRoutes["getIncident"]> = async (c) => {
  const { incidentId } = c.req.valid("param");

  const eff = Effect.gen(function* () {
    const service = yield* IncidentServiceTag;
    return yield* service.getIncidentById(incidentId);
  });

  const result = await c.var.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<IncidentSummary, 200>(toIncidentSummary(right), 200),
    ),
    Match.tag("Left", () =>
      c.json<IncidentNotFoundResponse, 404>(
        {
          error: incidentErrorMessages.INCIDENT_NOT_FOUND,
          details: {
            code: IncidentErrorCodeSchema.enum.INCIDENT_NOT_FOUND,
          },
        },
        404,
      ),
    ),
    Match.exhaustive,
  );
};

const createIncident: RouteHandler<IncidentRoutes["createIncident"]> = async (
  c,
) => {
  const userId = c.var.currentUser!.userId;
  const currentRole = c.var.currentUser!.role;
  const body = c.req.valid("json");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* IncidentServiceTag;
      return yield* service.createIncident({
        reporterUserId: userId,
        reporterRole: currentRole,
        rentalId: body.rentalId ?? null,
        bikeId: body.bikeId,
        stationId: body.stationId ?? null,
        incidentType: body.incidentType,
        description: body.description ?? null,
        latitude: body.latitude ? new Prisma.Decimal(body.latitude) : null,
        longitude: body.longitude ? new Prisma.Decimal(body.longitude) : null,
        fileUrls: body.fileUrls ?? [],
      });
    }),
    "POST /v1/incidents",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<IncidentSummary, 201>(toIncidentSummary(right), 201),
    ),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("AdminRentalNotFound", () =>
          c.json(
            {
              error: incidentErrorMessages.RENTAL_NOT_FOUND,
              details: {
                code: IncidentErrorCodeSchema.enum.RENTAL_NOT_FOUND,
                rentalId: body.rentalId,
              },
            },
            404,
          ),
        ),
        Match.tag("BikeNotFound", ({ id }) =>
          c.json(
            {
              error: incidentErrorMessages.BIKE_NOT_FOUND,
              details: {
                code: IncidentErrorCodeSchema.enum.BIKE_NOT_FOUND,
                bikeId: id,
              },
            },
            404,
          ),
        ),
        Match.tag("StationNotFound", ({ id }) =>
          c.json(
            {
              error: incidentErrorMessages.STATION_NOT_FOUND,
              details: {
                code: IncidentErrorCodeSchema.enum.STATION_NOT_FOUND,
                stationId: id,
              },
            },
            404,
          ),
        ),
        Match.orElse((err) => {
          throw err;
        }),
      ),
    ),
    Match.exhaustive,
  );
};

export const IncidentPublicController = {
  listIncidents,
  getIncident,
  createIncident,
} as const;
