import { RouteHandler } from "@hono/zod-openapi";
import {
  IncidentErrorCodeSchema,
  incidentErrorMessages,
  IncidentNotFoundResponse,
  IncidentRoutes,
  IncidentSummary,
} from "./shared";
import { withLoggedCause } from "@/domain/shared";
import { Effect, Match } from "effect";
import { IncidentServiceTag } from "@/domain/incident";
import { IncidentStatus } from "generated/kysely/types";
import { IncidentListResponse } from "@mebike/shared";
import { toIncidentSummary } from "@/http/presenters/incidents.presenter";

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

const getIncidentById: RouteHandler<IncidentRoutes["getIncident"]> = async (
  c,
) => {
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

export const IncidentPublicController = {
  listIncidents,
  getIncidentById,
} as const;
