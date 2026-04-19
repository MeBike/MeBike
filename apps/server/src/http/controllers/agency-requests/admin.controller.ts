import type { RouteHandler } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";
import { Effect, Match } from "effect";

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

import { AgencyRequestErrorCodeSchema, agencyRequestErrorMessages } from "./shared";

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

const approveAgencyRequest: RouteHandler<AgencyRequestsRoutes["adminApprove"]> = async (c) => {
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");
  const reviewedByUserId = c.var.currentUser!.userId;

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* AgencyRequestServiceTag;
      return yield* service.approve(id, {
        reviewedByUserId,
        description: body.description ?? undefined,
      });
    }),
    routeContext(agencyRequests.adminApprove),
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<AgencyRequestDetailResponse, 200>(toAgencyRequestAdminListItem(right), 200)),
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
        Match.tag("StationLocationAlreadyExists", ({ address, latitude, longitude }) =>
          c.json<AgencyRequestErrorResponse, 400>({
            error: agencyRequestErrorMessages.STATION_LOCATION_ALREADY_EXISTS,
            details: {
              code: AgencyRequestErrorCodeSchema.enum.STATION_LOCATION_ALREADY_EXISTS,
              address,
              latitude,
              longitude,
            },
          }, 400)),
        Match.orElse(() => {
          throw left;
        }),
      )),
    Match.exhaustive,
  );
};

const rejectAgencyRequest: RouteHandler<AgencyRequestsRoutes["adminReject"]> = async (c) => {
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");
  const reviewedByUserId = c.var.currentUser!.userId;
  const reviewDescription = body.description ?? body.reason ?? undefined;

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* AgencyRequestServiceTag;
      return yield* service.reject(id, {
        reviewedByUserId,
        description: reviewDescription,
      });
    }),
    routeContext(agencyRequests.adminReject),
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<AgencyRequestDetailResponse, 200>(toAgencyRequestAdminListItem(right), 200)),
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

export const AgencyRequestsAdminController = {
  approveAgencyRequest,
  getAgencyRequestById,
  listAgencyRequests,
  rejectAgencyRequest,
} as const;
