import type { RouteHandler } from "@hono/zod-openapi";
import type { RedistributionContracts } from "@mebike/shared";

import { uuidv7 } from "uuidv7";

import type { RedistributionRoutes } from "./shared";

const createRedistributionRequest: RouteHandler<RedistributionRoutes["createRedistributionRequest"]> = async (c) => {
  const payload = c.req.valid("json");
  const userId = (c.var as any).currentUser?.userId ?? "";
  const now = new Date().toISOString();

  const redistributionRequest: RedistributionContracts.RedistributionRequest = {
    id: uuidv7(),
    requestedByUserId: userId,
    approvedByUserId: undefined,
    sourceStationId: payload.sourceStationId,
    targetStationId: payload.targetStationId,
    targetAgencyId: payload.targetAgencyId,
    requestedQuantity: payload.requestedQuantity,
    reason: payload.reason,
    items: [],
    status: "PENDING_APPROVAL",
    startedAt: null,
    completedAt: null,
    createdAt: now,
    updatedat: now,
  };

  return c.json(
    {
      message: "Redistribution request created successfully",
      result: redistributionRequest,
    },
    201,
  );
};

const getMyRequestList: RouteHandler<RedistributionRoutes["getMyRequestList"]> = async (c) => {
  return c.json(
    {
      message: "My redistribution request list fetched successfully",
      result: { data: [], pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 } },
    },
    200,
  );
};

const getMyRequestDetail: RouteHandler<RedistributionRoutes["getMyRequestDetail"]> = async (c) => {
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
      fullname: "Test User",
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
      message: "My redistribution request detail fetched successfully",
      result: detail,
    },
    200,
  );
};

export const RedistributionMeController = {
  createRedistributionRequest,
  getMyRequestList,
  getMyRequestDetail,
} as const;
