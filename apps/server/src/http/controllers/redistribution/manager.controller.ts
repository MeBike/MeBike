import type { RouteHandler } from "@hono/zod-openapi";
import type { RedistributionContracts } from "@mebike/shared";

import { Effect, Match } from "effect";

import { RedistributionServiceTag } from "@/domain/redistribution";
import { withLoggedCause } from "@/domain/shared";
import {
  toContractRedistributionRequestDetail,
  toContractRedistributionRequestListItem,
} from "@/http/presenters/redistribution.presenter";
import { toContractPage } from "@/http/shared/pagination";

import type { RedistributionRoutes } from "./shared";

import {
  RedistributionReqErrorCodeSchema,
  redistributionReqErrorMessages,
} from "./shared";

const getRequestListForManager: RouteHandler<
  RedistributionRoutes["getRequestListForManager"]
> = async (c) => {
  const query = c.req.valid("query");
  const { userId } = c.var.currentUser!;

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* RedistributionServiceTag;
      return yield* service.getListInStation(
        userId,
        {
          status: query.status,
          requestedByUserId: query.requestedByUserId,
          approvedByUserId: query.approvedByUserId,
          targetStationId: query.targetStationId,
        },
        {
          page: Number(query.page ?? 1),
          pageSize: Number(query.pageSize ?? 50),
          sortBy: query.sortBy ?? "createdAt",
          sortDir: query.sortDir ?? "desc",
        },
      );
    }),
    "GET /v1/manager/redistribution-requests",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<
        {
          message: string;
        } & { result: RedistributionContracts.RedistributionRequestList },
        200
      >(
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

const getRequestDetailForManager: RouteHandler<
  RedistributionRoutes["getRequestDetailForManager"]
> = async (c) => {
  const { requestId } = c.req.valid("param");
  const { userId } = c.var.currentUser!;

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* RedistributionServiceTag;
      return yield* service.getRequestInStation({ userId, requestId });
    }),
    "GET /v1/manager/redistribution-requests/{requestId}",
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
              error:
                redistributionReqErrorMessages.REDISTRIBUTION_REQUEST_NOT_FOUND,
              details: {
                code: RedistributionReqErrorCodeSchema.enum
                  .REDISTRIBUTION_REQUEST_NOT_FOUND,
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
                sourceStationId: error.sourceStationId,
                targetStationId: error.targetStationId,
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

const approveRedistributionRequest: RouteHandler<
  RedistributionRoutes["approveRedistributionRequest"]
> = async (c) => {
  const { userId } = c.var.currentUser!;
  const { requestId } = c.req.valid("param");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* RedistributionServiceTag;
      return yield* service.approve({ requestId, approvedByUserId: userId });
    }),
    "POST /v1/redistribution-requests/{requestId}/approve",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<{ message: string } & { result: RedistributionContracts.RedistributionRequestDetail }, 200>(
        {
          message: "Redistribution request approved successfully",
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
        Match.tag("UnauthorizedRedistributionApproval", error =>
          c.json<RedistributionContracts.RedistributionReqErrorResponse, 403>(
            {
              error: redistributionReqErrorMessages.UNAUTHORIZED_REDISTRIBUTION_APPROVAL,
              details: {
                code: RedistributionReqErrorCodeSchema.enum.UNAUTHORIZED_REDISTRIBUTION_APPROVAL,
                requestId: error.requestId,
                targetStationId: error.targetStationId,
                workingStationId: error.workingStationId,
              },
            },
            403,
          )),
        Match.tag("CannotApproveNonPendingRedistribution", error =>
          c.json<RedistributionContracts.RedistributionReqErrorResponse, 400>(
            {
              error: redistributionReqErrorMessages.CANNOT_APPROVE_NON_PENDING_REDISTRIBUTION,
              details: {
                code: RedistributionReqErrorCodeSchema.enum.CANNOT_APPROVE_NON_PENDING_REDISTRIBUTION,
                requestId: error.requestId,
                currentStatus: error.currentStatus,
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

const rejectRedistributionRequest: RouteHandler<
  RedistributionRoutes["rejectRedistributionRequest"]
> = async (c) => {
  const { userId } = c.var.currentUser!;
  const { requestId } = c.req.valid("param");
  const body = c.req.valid("json");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* RedistributionServiceTag;
      return yield* service.reject({ requestId, rejectedByUserId: userId, reason: body.reason });
    }),
    "POST /v1/redistribution-requests/{requestId}/reject",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<{ message: string } & { result: RedistributionContracts.RedistributionRequestDetail }, 200>(
        {
          message: "Redistribution request rejected successfully",
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
        Match.tag("UnauthorizedRedistributionRejection", error =>
          c.json<RedistributionContracts.RedistributionReqErrorResponse, 403>(
            {
              error: redistributionReqErrorMessages.UNAUTHORIZED_REDISTRIBUTION_REJECTION,
              details: {
                code: RedistributionReqErrorCodeSchema.enum.UNAUTHORIZED_REDISTRIBUTION_REJECTION,
                requestId: error.requestId,
                targetStationId: error.targetStationId,
                workingStationId: error.workingStationId,
              },
            },
            403,
          )),
        Match.tag("CannotRejectNonPendingRedistribution", error =>
          c.json<RedistributionContracts.RedistributionReqErrorResponse, 400>(
            {
              error: redistributionReqErrorMessages.CANNOT_REJECT_NON_PENDING_REDISTRIBUTION,
              details: {
                code: RedistributionReqErrorCodeSchema.enum.CANNOT_REJECT_NON_PENDING_REDISTRIBUTION,
                requestId: error.requestId,
                currentStatus: error.currentStatus,
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

const confirmRedistributionRequestCompletion: RouteHandler<
  RedistributionRoutes["confirmRedistributionRequestCompletion"]
> = async (c) => {
  const { userId } = c.var.currentUser!;
  const { requestId } = c.req.valid("param");
  const { completedBikeIds } = c.req.valid("json");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* RedistributionServiceTag;
      return yield* service.confirmCompletion({ requestId, confirmedByUserId: userId, completedBikeIds });
    }),
    "POST /v1/redistribution-requests/{requestId}/confirm-completion",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<{ message: string } & { result: RedistributionContracts.RedistributionRequestDetail }, 200>(
        {
          message: "Redistribution request completed successfully",
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
        Match.tag("UnauthorizedRedistributionCompletion", error =>
          c.json<RedistributionContracts.RedistributionReqErrorResponse, 403>(
            {
              error: redistributionReqErrorMessages.UNAUTHORIZED_COMPLETED_REDISTRIBUTION_CONFIRMATION,
              details: {
                code: RedistributionReqErrorCodeSchema.enum.UNAUTHORIZED_COMPLETED_REDISTRIBUTION_CONFIRMATION,
                requestId: error.requestId,
                targetStationId: error.targetStationId,
                workingStationId: error.workingStationId,
              },
            },
            403,
          )),
        Match.tag("CannotConfirmNonTransitedRedistribution", error =>
          c.json<RedistributionContracts.RedistributionReqErrorResponse, 400>(
            {
              error: redistributionReqErrorMessages.CANNOT_COMPLETE_NON_TRANSIT_OR_PARTIALLY_COMPLETED_REDISTRIBUTION,
              details: {
                code: RedistributionReqErrorCodeSchema.enum.CANNOT_COMPLETE_NON_TRANSIT_OR_PARTIALLY_COMPLETED_REDISTRIBUTION,
                requestId: error.requestId,
                currentStatus: error.currentStatus,
              },
            },
            400,
          )),
        Match.tag("InvalidBikeIdsForRedistributionCompletion", error =>
          c.json<RedistributionContracts.RedistributionReqErrorResponse, 400>(
            {
              error: redistributionReqErrorMessages.INVALID_BIKE_IDS_FOR_REDISTRIBUTION_COMPLETION,
              details: {
                code: RedistributionReqErrorCodeSchema.enum.INVALID_BIKE_IDS_FOR_REDISTRIBUTION_COMPLETION,
                requestId: error.requestId,
                providedBikeIds: error.providedBikeIds,
                unconfirmedBikeIds: error.unconfirmedBikeIds,
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

export const RedistributionManagerController = {
  getRequestListForManager,
  getRequestDetailForManager,
  approveRedistributionRequest,
  rejectRedistributionRequest,
  confirmRedistributionRequestCompletion,
} as const;
