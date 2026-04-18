import type { RouteHandler } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";
import { Effect, Match } from "effect";

import { AgencyRequestServiceTag } from "@/domain/agency-requests";
import { withLoggedCause } from "@/domain/shared";
import { toAgencyRequest } from "@/http/presenters/agency-requests.presenter";
import { routeContext } from "@/http/shared/route-context";

import type {
  AgencyRequest,
  AgencyRequestErrorResponse,
  AgencyRequestsRoutes,
  AgencyRequestUserDetailResponse,
  AgencyRequestUserListResponse,
} from "./shared";

import { AgencyRequestErrorCodeSchema, agencyRequestErrorMessages } from "./shared";

const agencyRequests = serverRoutes.agencyRequests;

const listMyAgencyRequests: RouteHandler<AgencyRequestsRoutes["listMine"]> = async (c) => {
  const userId = c.var.currentUser!.userId;
  const query = c.req.valid("query");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* AgencyRequestServiceTag;
      return yield* service.listWithOffset(
        {
          requesterUserId: userId,
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
    routeContext(agencyRequests.listMine),
  );

  const result = await c.var.runPromise(eff);
  return c.json<AgencyRequestUserListResponse, 200>({
    data: result.items.map(toAgencyRequest),
    pagination: {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    },
  }, 200);
};

const getMyAgencyRequestById: RouteHandler<AgencyRequestsRoutes["getMine"]> = async (c) => {
  const userId = c.var.currentUser!.userId;
  const { id } = c.req.valid("param");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* AgencyRequestServiceTag;
      return yield* service.getByIdAsRequester(id, userId);
    }),
    routeContext(agencyRequests.getMine),
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<AgencyRequestUserDetailResponse, 200>(toAgencyRequest(right), 200)),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("AgencyRequestNotFound", ({ agencyRequestId }) =>
          c.json<AgencyRequestErrorResponse, 404>({
            error: agencyRequestErrorMessages.AGENCY_REQUEST_NOT_FOUND,
            details: {
              code: AgencyRequestErrorCodeSchema.enum.AGENCY_REQUEST_NOT_FOUND,
              agencyRequestId,
            },
          }, 404)),
        Match.tag("AgencyRequestNotOwned", ({ agencyRequestId, userId: failedUserId }) =>
          c.json<AgencyRequestErrorResponse, 400>({
            error: agencyRequestErrorMessages.AGENCY_REQUEST_NOT_OWNED,
            details: {
              code: AgencyRequestErrorCodeSchema.enum.AGENCY_REQUEST_NOT_OWNED,
              agencyRequestId,
              userId: failedUserId,
            },
          }, 400)),
        Match.orElse(() => {
          throw left;
        }),
      )),
    Match.exhaustive,
  );
};

const cancelAgencyRequest: RouteHandler<AgencyRequestsRoutes["cancel"]> = async (c) => {
  const userId = c.var.currentUser!.userId;
  const { id } = c.req.valid("param");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* AgencyRequestServiceTag;
      return yield* service.cancelAsRequester(id, userId);
    }),
    "POST /v1/agency-requests/{id}/cancel",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<AgencyRequest, 200>(toAgencyRequest(right), 200)),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("AgencyRequestNotFound", ({ agencyRequestId }) =>
          c.json<AgencyRequestErrorResponse, 404>({
            error: agencyRequestErrorMessages.AGENCY_REQUEST_NOT_FOUND,
            details: {
              code: AgencyRequestErrorCodeSchema.enum.AGENCY_REQUEST_NOT_FOUND,
              agencyRequestId,
            },
          }, 404)),
        Match.tag("AgencyRequestNotOwned", ({ agencyRequestId, userId: failedUserId }) =>
          c.json<AgencyRequestErrorResponse, 400>({
            error: agencyRequestErrorMessages.AGENCY_REQUEST_NOT_OWNED,
            details: {
              code: AgencyRequestErrorCodeSchema.enum.AGENCY_REQUEST_NOT_OWNED,
              agencyRequestId,
              userId: failedUserId,
            },
          }, 400)),
        Match.tag("InvalidAgencyRequestStatusTransition", ({ agencyRequestId, currentStatus, nextStatus }) =>
          c.json<AgencyRequestErrorResponse, 400>({
            error: agencyRequestErrorMessages.INVALID_AGENCY_REQUEST_STATUS_TRANSITION,
            details: {
              code: AgencyRequestErrorCodeSchema.enum.INVALID_AGENCY_REQUEST_STATUS_TRANSITION,
              agencyRequestId,
              currentStatus,
              nextStatus,
            },
          }, 400)),
        Match.orElse(() => {
          throw left;
        }),
      )),
    Match.exhaustive,
  );
};

export const AgencyRequestsMeController = {
  cancelAgencyRequest,
  getMyAgencyRequestById,
  listMyAgencyRequests,
} as const;
