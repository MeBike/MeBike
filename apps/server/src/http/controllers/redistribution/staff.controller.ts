import type { RouteHandler } from "@hono/zod-openapi";
import type { RedistributionContracts } from "@mebike/shared";

import { Effect, Match } from "effect";

import { RedistributionServiceTag } from "@/domain/redistribution";
import { withLoggedCause } from "@/domain/shared";
import {
  toContractRedistributionRequest,
  toContractRedistributionRequestDetail,
  toContractRedistributionRequestListItem,
} from "@/http/presenters/redistribution.presenter";
import { toContractPage } from "@/http/shared/pagination";

import type { RedistributionRoutes } from "./shared";

import {
  RedistributionReqErrorCodeSchema,
  redistributionReqErrorMessages,
} from "./shared";

const createRedistributionRequest: RouteHandler<
  RedistributionRoutes["createRedistributionRequest"]
> = async (c) => {
  const payload = c.req.valid("json");
  const userId = c.var.currentUser!.userId;
  const defaultReason = "Lack of available bikes";

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* RedistributionServiceTag;
      return yield* service.createRequestTo({
        requestedByUserId: userId,
        sourceStationId: payload.sourceStationId,
        targetStationId: payload.targetStationId,
        requestedQuantity: payload.requestedQuantity,
        reason: payload.reason ?? defaultReason,
      });
    }),
    "POST /v1/redistribution-requests/",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json(toContractRedistributionRequest(right), 201)),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("UserNotFound", ({ userId }) =>
          c.json<RedistributionContracts.RedistributionReqErrorResponse, 404>(
            {
              error: redistributionReqErrorMessages.USER_NOT_FOUND,
              details: {
                code: RedistributionReqErrorCodeSchema.enum.USER_NOT_FOUND,
                userId,
              },
            },
            404,
          )),
        Match.tag("StationNotFound", ({ stationId }) =>
          c.json<RedistributionContracts.RedistributionReqErrorResponse, 404>(
            {
              error: redistributionReqErrorMessages.STATION_NOT_FOUND,
              details: {
                code: RedistributionReqErrorCodeSchema.enum.STATION_NOT_FOUND,
                stationId,
              },
            },
            404,
          )),
        Match.tag(
          "UnauthorizedRedistributionCreation",
          ({ requestedByUserId, sourceStationId, workingStationId }) =>
            c.json<RedistributionContracts.RedistributionReqErrorResponse, 403>(
              {
                error:
                  redistributionReqErrorMessages.UNAUTHORIZED_REDISTRIBUTION_CREATION,
                details: {
                  code: RedistributionReqErrorCodeSchema.enum
                    .UNAUTHORIZED_REDISTRIBUTION_CREATION,
                  requestedByUserId,
                  sourceStationId,
                  workingStationId,
                },
              },
              403,
            ),
        ),
        Match.tag("IncompletedRedistributionRequestExists", error =>
          c.json<RedistributionContracts.RedistributionReqErrorResponse, 400>(
            {
              error:
                redistributionReqErrorMessages.INCOMPLETED_REDISTRIBUTION_REQUEST_EXISTS,
              details: {
                code: RedistributionReqErrorCodeSchema.enum
                  .INCOMPLETED_REDISTRIBUTION_REQUEST_EXISTS,
                requestId: error.requestId,
                sourceStationId: error.sourceStationId,
                status: error.status,
              },
            },
            400,
          )),
        Match.tag("NotEnoughBikesAtStation", error =>
          c.json<RedistributionContracts.RedistributionReqErrorResponse, 400>(
            {
              error:
                redistributionReqErrorMessages.INSUFFICIENT_AVAILABLE_BIKES,
              details: {
                code: RedistributionReqErrorCodeSchema.enum
                  .INSUFFICIENT_AVAILABLE_BIKES,
                stationId: error.stationId,
                required: error.required,
                available: error.available,
              },
            },
            400,
          )),
        Match.tag("NotEnoughEmptySlotsAtTarget", error =>
          c.json<RedistributionContracts.RedistributionReqErrorResponse, 400>(
            {
              error: redistributionReqErrorMessages.INSUFFICIENT_EMPTY_SLOTS,
              details: {
                code: RedistributionReqErrorCodeSchema.enum
                  .INSUFFICIENT_EMPTY_SLOTS,
                stationId: error.targetId,
                required: error.required,
                available: error.available,
              },
            },
            400,
          )),
        Match.tag("ExceededMinBikesAtStation", error =>
          c.json<RedistributionContracts.RedistributionReqErrorResponse, 400>(
            {
              error:
                redistributionReqErrorMessages.EXCEEDED_MIN_BIKES_AT_STATION,
              details: {
                code: RedistributionReqErrorCodeSchema.enum
                  .EXCEEDED_MIN_BIKES_AT_STATION,
                stationId: error.stationId,
                minBikes: error.minBikes,
                restBikesAfterFulfillment: error.restBikesAfterFulfillment,
              },
            },
            400,
          )),
        Match.orElse(() => {
          throw left;
        }),
      )),
    Match.exhaustive,
  );
};

const cancelRedistributionRequest: RouteHandler<
  RedistributionRoutes["cancelRedistributionRequest"]
> = async (c) => {
  const payload = c.req.valid("json");
  const userId = c.var.currentUser!.userId;
  const { requestId } = c.req.valid("param");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* RedistributionServiceTag;
      return yield* service.cancel({
        requestId,
        userId,
        reason: payload.reason,
      });
    }),
    "POST /v1/redistribution-requests/{requestId}/cancel",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json(toContractRedistributionRequestDetail(right), 200)),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag(
          "CannotCancelNonPendingRedistribution",
          ({ requestId, currentStatus }) =>
            c.json<RedistributionContracts.RedistributionReqErrorResponse, 400>(
              {
                error:
                  redistributionReqErrorMessages.CANNOT_CANCEL_NON_PENDING_REDISTRIBUTION,
                details: {
                  code: RedistributionReqErrorCodeSchema.enum
                    .CANNOT_CANCEL_NON_PENDING_REDISTRIBUTION,
                  requestId,
                  currentStatus,
                },
              },
              400,
            ),
        ),
        Match.tag(
          "UnauthorizedRedistributionCancellation",
          ({ requestId, requestedByUserId, cancelledByUserId }) =>
            c.json<RedistributionContracts.RedistributionReqErrorResponse, 403>(
              {
                error:
                  redistributionReqErrorMessages.UNAUTHORIZED_REDISTRIBUTION_CANCELLATION,
                details: {
                  code: RedistributionReqErrorCodeSchema.enum
                    .UNAUTHORIZED_REDISTRIBUTION_CANCELLATION,
                  requestId,
                  requestedByUserId,
                  cancelledByUserId,
                },
              },
              403,
            ),
        ),
        Match.tag("RedistributionRequestNotFound", ({ requestId }) =>
          c.json<RedistributionContracts.RedistributionReqErrorResponse, 404>(
            {
              error:
                redistributionReqErrorMessages.REDISTRIBUTION_REQUEST_NOT_FOUND,
              details: {
                code: RedistributionReqErrorCodeSchema.enum
                  .REDISTRIBUTION_REQUEST_NOT_FOUND,
                requestId,
              },
            },
            404,
          )),
        Match.orElse(() => {
          throw left;
        }),
      )),
    Match.exhaustive,
  );
};

const getRequestListForStaff: RouteHandler<
  RedistributionRoutes["getRequestListForStaff"]
> = async (c) => {
  const userId = c.var.currentUser!.userId;
  const query = c.req.valid("query");
  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* RedistributionServiceTag;
      return yield* service.getMyListInStation(
        userId,
        {
          status: query.status,
          targetStationId: query.targetStationId,
          from: query.from ? new Date(query.from) : undefined,
          to: query.to ? new Date(query.to) : undefined,
        },
        {
          page: Number(query.page ?? 1),
          pageSize: Number(query.pageSize ?? 50),
          sortBy: query.sortBy ?? "createdAt",
          sortDir: query.sortDir ?? "desc",
        },
      );
    }),
    "GET /v1/staff/redistribution-requests",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<RedistributionContracts.RedistributionRequestList, 200>(
        {
          data: right.items.map(toContractRedistributionRequestListItem),
          pagination: toContractPage(right),
        },
        200,
      )),
    Match.tag("Left", ({ left }) => {
      throw left;
    }),
    Match.exhaustive,
  );
};

const getRequestHistoryForStaff: RouteHandler<
  RedistributionRoutes["getRequestHistoryForStaff"]
> = async (c) => {
  const userId = c.var.currentUser!.userId;
  const query = c.req.valid("query");
  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* RedistributionServiceTag;
      return yield* service.getHistoryForStaff(
        userId,
        {
          status: query.status,
          targetStationId: query.targetStationId,
          from: query.from ? new Date(query.from) : undefined,
          to: query.to ? new Date(query.to) : undefined,
        },
        {
          page: Number(query.page ?? 1),
          pageSize: Number(query.pageSize ?? 50),
          sortBy: query.sortBy ?? "createdAt",
          sortDir: query.sortDir ?? "desc",
        },
      );
    }),
    "GET /v1/staff/redistribution-requests/history",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<RedistributionContracts.RedistributionRequestList, 200>(
        {
          data: right.items.map(toContractRedistributionRequestListItem),
          pagination: toContractPage(right),
        },
        200,
      )),
    Match.tag("Left", ({ left }) => {
      throw left;
    }),
    Match.exhaustive,
  );
};

const getRequestDetailForStaff: RouteHandler<
  RedistributionRoutes["getRequestDetailForStaff"]
> = async (c) => {
  const { userId } = c.var.currentUser!;
  const { requestId } = c.req.valid("param");
  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* RedistributionServiceTag;
      return yield* service.getMyRequestInStation({ userId, requestId });
    }),
    "GET /v1/staff/redistribution-requests/{requestId}",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json(toContractRedistributionRequestDetail(right), 200)),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("RedistributionRequestNotFound", error =>
          c.json<RedistributionContracts.RedistributionReqErrorResponse, 404>(
            {
              error: redistributionReqErrorMessages.REDISTRIBUTION_REQUEST_NOT_FOUND,
              details: {
                code: RedistributionReqErrorCodeSchema.enum.REDISTRIBUTION_REQUEST_NOT_FOUND,
                requestId: error.requestId,
              },
            },
            404,
          )),
        Match.tag("UnauthorizedRedistributionAccess", error =>
          c.json<RedistributionContracts.RedistributionReqErrorResponse, 403>(
            {
              error: redistributionReqErrorMessages.UNAUTHORIZED_ACCESS,
              details: {
                code: RedistributionReqErrorCodeSchema.enum.UNAUTHORIZED_ACCESS,
                requestId: error.requestId,
                userId: error.userId,
              },
            },
            403,
          )),
        Match.orElse(() => {
          throw left;
        }),
      )),
    Match.exhaustive,
  );
};

const startTransition: RouteHandler<
  RedistributionRoutes["startTransition"]
> = async (c) => {
  const userId = (c.var as any).currentUser?.userId ?? "";
  const { requestId } = c.req.valid("param");
  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* RedistributionServiceTag;
      return yield* service.startTransition({ userId, requestId });
    }),
    "POST /v1/redistribution-requests/{requestId}/start-transit",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json(toContractRedistributionRequestDetail(right), 200)),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("UserNotFound", error =>
          c.json<RedistributionContracts.RedistributionReqErrorResponse, 404>(
            {
              error: redistributionReqErrorMessages.USER_NOT_FOUND,
              details: {
                code: RedistributionReqErrorCodeSchema.enum.USER_NOT_FOUND,
                userId: error.userId,
              },
            },
            404,
          )),
        Match.tag("StationNotFound", error =>
          c.json<RedistributionContracts.RedistributionReqErrorResponse, 404>(
            {
              error: redistributionReqErrorMessages.STATION_NOT_FOUND,
              details: {
                code: RedistributionReqErrorCodeSchema.enum.STATION_NOT_FOUND,
                stationId: error.stationId,
              },
            },
            404,
          )),
        Match.tag("RedistributionRequestNotFound", error =>
          c.json<RedistributionContracts.RedistributionReqErrorResponse, 404>(
            {
              error: redistributionReqErrorMessages.REDISTRIBUTION_REQUEST_NOT_FOUND,
              details: {
                code: RedistributionReqErrorCodeSchema.enum.REDISTRIBUTION_REQUEST_NOT_FOUND,
                requestId: error.requestId,
              },
            },
            404,
          )),
        Match.tag("UnauthorizedStartTransition", error =>
          c.json<RedistributionContracts.RedistributionReqErrorResponse, 403>(
            {
              error: redistributionReqErrorMessages.UNAUTHORIZED_START_TRANSITION,
              details: {
                code: RedistributionReqErrorCodeSchema.enum.UNAUTHORIZED_START_TRANSITION,
                requestId: error.requestId,
                requestedByUserId: error.requestedByUserId,
                startedByUserId: error.startedByUserId,
              },
            },
            403,
          )),
        Match.tag("CannotStartTransitionNonApprovedRedistribution", error =>
          c.json<RedistributionContracts.RedistributionReqErrorResponse, 400>(
            {
              error: redistributionReqErrorMessages.CANNOT_START_TRANSIT_NON_APPROVED_REDISTRIBUTION,
              details: {
                code: RedistributionReqErrorCodeSchema.enum.CANNOT_START_TRANSIT_NON_APPROVED_REDISTRIBUTION,
                requestId: error.requestId,
                currentStatus: error.currentStatus,
              },
            },
            400,
          )),
        Match.tag("NoBikesInRedistributionRequest", error =>
          c.json<RedistributionContracts.RedistributionReqErrorResponse, 400>({
            error: redistributionReqErrorMessages.NO_BIKES_IN_REDISTRIBUTION_REQUEST,
            details: {
              code: RedistributionReqErrorCodeSchema.enum.NO_BIKES_IN_REDISTRIBUTION_REQUEST,
              requestId: error.requestId,
            },
          }, 400)),
        Match.tag("NotEnoughEmptySlotsAtTarget", error =>
          c.json<RedistributionContracts.RedistributionReqErrorResponse, 400>(
            {
              error: redistributionReqErrorMessages.INSUFFICIENT_EMPTY_SLOTS,
              details: {
                code: RedistributionReqErrorCodeSchema.enum
                  .INSUFFICIENT_EMPTY_SLOTS,
                stationId: error.targetId,
                required: error.required,
                available: error.available,
              },
            },
            400,
          )),
        Match.orElse(() => {
          throw left;
        }),
      )),
    Match.exhaustive,
  );
};

export const RedistributionStaffController = {
  createRedistributionRequest,
  cancelRedistributionRequest,
  getRequestListForStaff,
  getRequestHistoryForStaff,
  getRequestDetailForStaff,
  startTransition,
} as const;
