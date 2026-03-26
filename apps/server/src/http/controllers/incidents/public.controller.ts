import type { RouteHandler } from "@hono/zod-openapi";
import type { IncidentsContracts } from "@mebike/shared";

import { Effect, Match } from "effect";

import type { IncidentStatus } from "generated/kysely/types";

import { IncidentServiceTag } from "@/domain/incident";
import { withLoggedCause } from "@/domain/shared";
import { toIncidentSummary } from "@/http/presenters/incidents.presenter";
import { Prisma } from "generated/prisma/client";

import type {
  IncidentRoutes,
  IncidentSummary,
} from "./shared";

import { IncidentErrorCodeSchema, incidentErrorMessages } from "./shared";

const listIncidents: RouteHandler<IncidentRoutes["listIncidents"]> = async (
  c,
) => {
  const user = c.var.currentUser;
  const query = c.req.valid("query");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* IncidentServiceTag;
      return yield* service.listIncidents(
        user!.role,
        {
          stationId: query.stationId,
          status: query.status as IncidentStatus,
          userId: user?.role === "ADMIN" ? undefined : user?.userId,
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
  return c.json<IncidentsContracts.IncidentListResponse, 200>(
    {
      data: value.items,
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
  const user = c.var.currentUser;
  const { incidentId } = c.req.valid("param");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* IncidentServiceTag;
      return yield* service.getIncidentById(
        incidentId,
        user?.userId,
        user?.role,
      );
    }),
    "GET /v1/incidents/:incidentId",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) => c.json(right, 200)),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("IncidentNotFound", () =>
          c.json(
            {
              error: incidentErrorMessages.INCIDENT_NOT_FOUND,
              details: {
                code: IncidentErrorCodeSchema.enum.INCIDENT_NOT_FOUND,
                incidentId,
              },
            },
            404,
          ),
        ),
        Match.tag("UnauthorizedIncidentAccess", ({ incidentId, userId }) =>
          c.json(
            {
              error: incidentErrorMessages.UNAUTHORIZED_INCIDENT_ACCESS,
              details: {
                code: IncidentErrorCodeSchema.enum.UNAUTHORIZED_INCIDENT_ACCESS,
                incidentId,
                userId,
              },
            },
            403,
          ),
        ),
        Match.orElse((err) => {
          throw err;
        }),
      ),
    ),
    Match.exhaustive,
    // Match.tag("Left", () =>
    //   c.json<IncidentNotFoundResponse, 404>(
    //     {
    //       error: incidentErrorMessages.INCIDENT_NOT_FOUND,
    //       details: {
    //         code: IncidentErrorCodeSchema.enum.INCIDENT_NOT_FOUND,
    //       },
    //     },
    //     404,
    //   )),
    // Match.exhaustive,
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
        Match.tag("NoNearestStationFound", ({ latitude, longitude }) =>
          c.json(
            {
              error: incidentErrorMessages.NO_NEAREST_STATION_FOUND,
              details: {
                code: IncidentErrorCodeSchema.enum.NO_NEAREST_STATION_FOUND,
                latitude,
                longitude,
              },
            },
            404,
          ),
        ),
        Match.tag("BikeNotAvailable", ({ bikeId, status }) =>
          c.json(
            {
              error: incidentErrorMessages.BIKE_NOT_AVAILABLE,
              details: {
                code: IncidentErrorCodeSchema.enum.BIKE_NOT_AVAILABLE,
                bikeId,
                status,
              },
            },
            404,
          ),
        ),
        Match.tag("NoAvailableTechnicianFound", ({ latitude, longitude }) =>
          c.json(
            {
              error: incidentErrorMessages.NO_AVAILABLE_TECHNICIAN_FOUND,
              details: {
                code: IncidentErrorCodeSchema.enum
                  .NO_AVAILABLE_TECHNICIAN_FOUND,
                latitude,
                longitude,
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

const updateIncident: RouteHandler<IncidentRoutes["updateIncident"]> = async (
  c,
) => {
  const userId = c.var.currentUser!.userId;
  const { incidentId } = c.req.valid("param");
  const body = c.req.valid("json");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* IncidentServiceTag;
      return yield* service.updateIncident(userId, incidentId, body);
    }),
    "PUT /v1/incidents/:incidentId",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) => c.json(right, 200)),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("IncidentNotFound", () =>
          c.json(
            {
              error: incidentErrorMessages.INCIDENT_NOT_FOUND,
              details: {
                code: IncidentErrorCodeSchema.enum.INCIDENT_NOT_FOUND,
                incidentId,
              },
            },
            404,
          ),
        ),
        Match.tag("UnauthorizedIncidentAccess", ({ incidentId, userId }) =>
          c.json(
            {
              error: incidentErrorMessages.UNAUTHORIZED_INCIDENT_ACCESS,
              details: {
                code: IncidentErrorCodeSchema.enum.UNAUTHORIZED_INCIDENT_ACCESS,
                incidentId,
                userId,
              },
            },
            403,
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
  updateIncident,
} as const;
