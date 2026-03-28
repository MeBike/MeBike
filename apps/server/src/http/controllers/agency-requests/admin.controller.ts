import type { RouteHandler } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";
import { Effect } from "effect";

import { AgencyRequestServiceTag } from "@/domain/agency-requests";
import { withLoggedCause } from "@/domain/shared";
import { toAgencyRequestAdminListItem } from "@/http/presenters/agency-requests.presenter";
import { routeContext } from "@/http/shared/route-context";

import type { AgencyRequestListResponse, AgencyRequestsRoutes } from "./shared";

const agencyRequests = serverRoutes.agencyRequests;

const listAgencyRequests: RouteHandler<AgencyRequestsRoutes["adminList"]> = async (c) => {
  const query = c.req.valid("query");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* AgencyRequestServiceTag;
      return yield* service.listWithOffset(
        {
          requesterUserId: query.requesterUserId,
          requesterEmail: query.requesterEmail,
          agencyName: query.agencyName,
          status: query.status,
        },
        {
          page: query.page ?? 1,
          pageSize: query.pageSize ?? 50,
          sortBy: query.sortBy,
          sortDir: query.sortDir,
        },
      );
    }),
    routeContext(agencyRequests.adminList),
  );

  const result = await c.var.runPromise(eff);
  return c.json<AgencyRequestListResponse, 200>({
    data: result.items.map(toAgencyRequestAdminListItem),
    pagination: {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    },
  }, 200);
};

export const AgencyRequestsAdminController = {
  listAgencyRequests,
} as const;
