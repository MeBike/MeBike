import type { RouteHandler } from "@hono/zod-openapi";
import type { RedistributionContracts } from "@mebike/shared";

import { Effect, Match } from "effect";
import { uuidv7 } from "uuidv7";

import { RedistributionServiceTag } from "@/domain/redistribution";
import { withLoggedCause } from "@/domain/shared";
import { toContractRedistributionRequest } from "@/http/presenters/redistribution.presenter";

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
        Match.tag("UnauthorizedRedistributionCreation", ({ userId, sourceStationId }) =>
          c.json<RedistributionContracts.RedistributionReqErrorResponse, 403>(
            {
              error: redistributionReqErrorMessages.UNAUTHORIZED_REDISTRIBUTION_CREATION,
              details: {
                code: RedistributionReqErrorCodeSchema.enum.UNAUTHORIZED_REDISTRIBUTION_CREATION,
                userId,
                sourceStationId,
              },
            },
            403,
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
  return c.json(
    {
      message: "Redistribution request list fetched successfully",
      result: {
        data: [],
        pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
      },
    },
    200,
  );
};

const getRequestDetailForStaff: RouteHandler<
  RedistributionRoutes["getRequestDetailForStaff"]
> = async (c) => {
  const now = new Date().toISOString();
  const userId = (c.var as any).currentUser?.userId ?? "";
  const detail: RedistributionContracts.RedistributionRequestDetail = {
    id: uuidv7(),
    reason: "Sample redistribution",
    requestedQuantity: 15,
    status: "PENDING_APPROVAL",
    startedAt: null,
    completedAt: null,
    createdAt: now,
    updatedat: now,
    requestedByUser: {
      id: userId,
      fullName: "Test User",
      email: "test@example.com",
      verify: "UNVERIFIED",
      location: "Unknown",
      username: "testuser",
      phoneNumber: "0000000000",
      avatar: "",
      role: "USER",
      nfcCardUid: undefined,
      updatedAt: now,
    },
    approvedByUser: null,
    sourceStation: {
      id: uuidv7(),
      name: "Source Station",
      address: "123 Source St",
      latitude: 1,
      longitude: 1,
      totalCapacity: 10,
      updatedAt: now,
      locationGeo: undefined,
    },
    targetStation: null,
    targetAgency: null,
    items: [],
  };

  return c.json(
    {
      message: "Redistribution request details fetched successfully",
      result: detail,
    },
    200,
  );
};

export const RedistributionStaffController = {
  createRedistributionRequest,
  getRequestListForStaff,
  getRequestDetailForStaff,
} as const;
