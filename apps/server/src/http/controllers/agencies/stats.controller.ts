import type { RouteHandler } from "@hono/zod-openapi";

import { Effect, Match } from "effect";

import { AgencyStatsServiceTag } from "@/domain/agencies";
import { withLoggedCause } from "@/domain/shared";
import { toAgencyOperationalStats } from "@/http/presenters/agencies.presenter";

import type {
  AgenciesRoutes,
  AgencyErrorResponse,
  AgencyOperationalStatsResponse,
} from "./shared";

import { AgencyErrorCodeSchema, agencyErrorMessages } from "./shared";

const getAgencyOperationalStats: RouteHandler<
  AgenciesRoutes["adminGetOperationalStats"]
> = async (c) => {
  const { id } = c.req.valid("param");
  const query = c.req.valid("query");

  const eff = withLoggedCause(
    Effect.flatMap(AgencyStatsServiceTag, service =>
      service.getAgencyOperationalStats(id, {
        from: query.from ? new Date(query.from) : undefined,
        to: query.to ? new Date(query.to) : undefined,
      })),
    "GET /v1/admin/agencies/{id}/stats",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<AgencyOperationalStatsResponse, 200>(
        toAgencyOperationalStats(right),
        200,
      )),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("AgencyNotFound", () =>
          c.json<AgencyErrorResponse, 404>({
            error: agencyErrorMessages.AGENCY_NOT_FOUND,
            details: {
              code: AgencyErrorCodeSchema.enum.AGENCY_NOT_FOUND,
              agencyId: id,
            },
          }, 404)),
        Match.orElse(() => {
          throw left;
        }),
      )),
    Match.exhaustive,
  );
};

export const AgencyStatsController = {
  getAgencyOperationalStats,
} as const;
