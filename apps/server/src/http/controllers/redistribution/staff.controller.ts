import type { RouteHandler } from "@hono/zod-openapi";
import type { RedistributionContracts } from "@mebike/shared";

import { Effect, Match } from "effect";
import { uuidv7 } from "uuidv7";

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
        targetStationId: payload.targetStationId ?? undefined,
        targetAgencyId: payload.targetAgencyId ?? undefined,
        requestedQuantity: payload.requestedQuantity,
        reason: payload.reason ?? defaultReason,
      });
    }),
    "POST /v1/staff/redistribution-requests/",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json(
        {
          message: "Redistribution request created successfully",
          result: toContractRedistributionRequest(right),
        },
        201,
      )),
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
          ({ userId, sourceStationId }) =>
            c.json<RedistributionContracts.RedistributionReqErrorResponse, 403>(
              {
                error:
                  redistributionReqErrorMessages.UNAUTHORIZED_REDISTRIBUTION_CREATION,
                details: {
                  code: RedistributionReqErrorCodeSchema.enum
                    .UNAUTHORIZED_REDISTRIBUTION_CREATION,
                  userId,
                  sourceStationId,
                },
              },
              403,
            ),
        ),
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
    "POST /v1/staff/redistribution-requests/{requestId}/cancel",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json(
        {
          message: "Redistribution request cancelled successfully",
          result: toContractRedistributionRequest(right),
        },
        200,
      )),
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
          ({ requestId, requestedByUserId, userId }) =>
            c.json<RedistributionContracts.RedistributionReqErrorResponse, 403>(
              {
                error:
                  redistributionReqErrorMessages.UNAUTHORIZED_REDISTRIBUTION_CANCELLATION,
                details: {
                  code: RedistributionReqErrorCodeSchema.enum
                    .UNAUTHORIZED_REDISTRIBUTION_CANCELLATION,
                  requestId,
                  requestedByUserId,
                  userId,
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
          targetAgencyId: query.targetAgencyId,
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
      c.json<{
        message: string;
      } & { result: RedistributionContracts.RedistributionRequestList }, 200>(
        {
          message: "Redistribution request list fetched successfully",
          result: {
            data: right.items.map(toContractRedistributionRequestListItem),
            pagination: toContractPage(right),
          },
        },
        200,
      )),
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
        Match.orElse(() => {
          throw left;
        }),
      )),
    Match.exhaustive,
  );
};

const getRequestDetailForStaff: RouteHandler<
  RedistributionRoutes["getRequestDetailForStaff"]
> = async (c) => {
  const userId = (c.var as any).currentUser?.userId ?? "";
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
      c.json(
        {
          message: "Redistribution request fetched successfully",
          result: toContractRedistributionRequestDetail(right),
        },
        200,
      )),
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

export const RedistributionStaffController = {
  createRedistributionRequest,
  cancelRedistributionRequest,
  getRequestListForStaff,
  getRequestDetailForStaff,
} as const;
