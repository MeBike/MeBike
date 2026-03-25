import type { RouteHandler } from "@hono/zod-openapi";

import { Effect, Match } from "effect";

import { IncidentServiceTag } from "@/domain/incident";
import { withLoggedCause } from "@/domain/shared";

import type { IncidentRoutes } from "./shared";

import { IncidentErrorCodeSchema, incidentErrorMessages } from "./shared";

const acceptIncident: RouteHandler<IncidentRoutes["acceptIncident"]> = async (
  c,
) => {
  const userId = c.var.currentUser!.userId;
  const { incidentId } = c.req.valid("param");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* IncidentServiceTag;
      return yield* service.acceptIncident(userId, incidentId);
    }),
    "PATCH /v1/incidents/:incidentId/accept",
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
          )),
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
          )),
        Match.orElse((err) => {
          throw err;
        }),
      )),
    Match.exhaustive,
  );
};

const rejectIncident: RouteHandler<IncidentRoutes["rejectIncident"]> = async (
  c,
) => {
  const userId = c.var.currentUser!.userId;
  const { incidentId } = c.req.valid("param");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* IncidentServiceTag;
      return yield* service.rejectIncident(userId, incidentId);
    }),
    "PATCH /v1/incidents/:incidentId/reject",
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
          )),
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
          )),
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
          )),
        Match.tag("NoAvailableTechnicianFound", ({ latitude, longitude }) =>
          c.json(
            {
              error: incidentErrorMessages.NO_AVAILABLE_TECHNICIAN_FOUND,
              details: {
                code: IncidentErrorCodeSchema.enum.NO_AVAILABLE_TECHNICIAN_FOUND,
                latitude,
                longitude,
              },
            },
            404,
          )),
        Match.orElse((err) => {
          throw err;
        }),
      )),
    Match.exhaustive,
  );
};

export const IncidentTechnicianController = {
  acceptIncident,
  rejectIncident,
} as const;
