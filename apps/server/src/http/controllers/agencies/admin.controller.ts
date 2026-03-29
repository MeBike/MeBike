import type { RouteHandler } from "@hono/zod-openapi";

import { Effect } from "effect";

import { AgencyServiceTag } from "@/domain/agencies";
import { toAgencySummary } from "@/http/presenters/agencies.presenter";

import type { AgenciesRoutes, AgencyListResponse } from "./shared";

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

export const AgencyAdminController = {
  listAgencies,
} as const;
