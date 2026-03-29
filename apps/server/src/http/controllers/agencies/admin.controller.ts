import type { RouteHandler } from "@hono/zod-openapi";

import { Effect, Match } from "effect";

import { AgencyServiceTag } from "@/domain/agencies";
import {
  toAgencyDetail,
  toAgencySummary,
} from "@/http/presenters/agencies.presenter";

import type {
  AgenciesRoutes,
  AgencyDetailResponse,
  AgencyErrorResponse,
  AgencyListResponse,
} from "./shared";

import { AgencyErrorCodeSchema, agencyErrorMessages } from "./shared";

const listAgencies: RouteHandler<AgenciesRoutes["adminList"]> = async (c) => {
  const query = c.req.valid("query");

  const eff = Effect.flatMap(AgencyServiceTag, service =>
    service.listAgencies(
      {
        name: query.name,
        address: query.address,
        contactPhone: query.contactPhone,
        status: query.status,
      },
      {
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 50,
        sortBy: query.sortBy ?? "name",
        sortDir: query.sortDir ?? "asc",
      },
    ));

  const result = await c.var.runPromise(eff);

  return c.json<AgencyListResponse, 200>({
    data: result.items.map(toAgencySummary),
    pagination: {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    },
  }, 200);
};

const getAgencyById: RouteHandler<AgenciesRoutes["adminGet"]> = async (c) => {
  const { id } = c.req.valid("param");

  const eff = Effect.flatMap(AgencyServiceTag, service => service.getAgencyById(id));
  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<AgencyDetailResponse, 200>(toAgencyDetail(right), 200)),
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

export const AgencyAdminController = {
  getAgencyById,
  listAgencies,
} as const;
