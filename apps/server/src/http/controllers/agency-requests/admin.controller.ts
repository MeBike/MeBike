import type { RouteHandler } from "@hono/zod-openapi";

import { AgencyRequestErrorCodeSchema, agencyRequestErrorMessages, serverRoutes } from "@mebike/shared";
import { Effect } from "effect";

import { AgencyRequestServiceTag } from "@/domain/agency-requests";
import { withLoggedCause } from "@/domain/shared";
import { toAgencyRequestAdminListItem } from "@/http/presenters/agency-requests.presenter";
import { routeContext } from "@/http/shared/route-context";

import type {
  AgencyRequestDetailResponse,
  AgencyRequestErrorResponse,
  AgencyRequestListResponse,
  AgencyRequestsRoutes,
} from "./shared";

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

const getAgencyRequestById: RouteHandler<AgencyRequestsRoutes["adminGet"]> = async (c) => {
  const { id } = c.req.valid("param");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* AgencyRequestServiceTag;
      return yield* service.getByIdOrFail(id);
    }),
    routeContext(agencyRequests.adminGet),
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));
  if (result._tag === "Right") {
    return c.json<AgencyRequestDetailResponse, 200>(toAgencyRequestAdminListItem(result.right), 200);
  }

  if (result.left._tag === "AgencyRequestNotFound") {
    return c.json<AgencyRequestErrorResponse, 404>({
      error: agencyRequestErrorMessages.AGENCY_REQUEST_NOT_FOUND,
      details: {
        code: AgencyRequestErrorCodeSchema.enum.AGENCY_REQUEST_NOT_FOUND,
        agencyRequestId: result.left.agencyRequestId,
      },
    }, 404);
  }

  throw result.left;
};

export const AgencyRequestsAdminController = {
  getAgencyRequestById,
  listAgencyRequests,
} as const;
