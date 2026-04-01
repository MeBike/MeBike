import type { RouteHandler } from "@hono/zod-openapi";
import type { RedistributionContracts } from "@mebike/shared";

import { Effect, Match } from "effect";
import { uuidv7 } from "uuidv7";

import { RedistributionServiceTag } from "@/domain/redistribution";
import { toContractRedistributionRequest } from "@/http/presenters/redistribution.presenter";

import { withLoggedCause } from "@/domain/shared";

import type { RedistributionRoutes } from "./shared";

const createRedistributionRequest: RouteHandler<RedistributionRoutes["createRedistributionRequest"]> = async (c) => {
  const payload = c.req.valid("json");
  const userId = c.var.currentUser!.userId;
  const defaultReason = "Lack of available bikes";

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* RedistributionServiceTag;
      return yield* service.createRequest({
        requestedByUserId: userId,
        sourceStationId: payload.sourceStationId,
        targetStationId: payload.targetStationId,
        targetAgencyId: payload.targetAgencyId,
        requestedQuantity: payload.requestedQuantity,
        reason: payload.reason ?? defaultReason,
      });
    }),
    "POST /v1/redistribution-requests/",
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
        Match.orElse(() => {
          throw left;
        }),
      )),
    Match.exhaustive,
  );
};

const getRequestListForStaff: RouteHandler<RedistributionRoutes["getMyRequestList"]> = async (c) => {
  return c.json(
    {
      message: "Redistribution request list fetched successfully",
      result: { data: [], pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 } },
    },
    200,
  );
};

const getRequestDetailForStaff: RouteHandler<RedistributionRoutes["getMyRequestDetail"]> = async (c) => {
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
