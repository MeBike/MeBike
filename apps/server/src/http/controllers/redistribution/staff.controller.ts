import type { RouteHandler } from "@hono/zod-openapi";
import type { RedistributionContracts } from "@mebike/shared";

import { uuidv7 } from "uuidv7";

import type { RedistributionRoutes } from "./shared";

const getRequestListForStaff: RouteHandler<RedistributionRoutes["getRequestListForStaff"]> = async (c) => {
  return c.json(
    {
      message: "Redistribution request list fetched successfully",
      result: { data: [], pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 } },
    },
    200,
  );
};

const getRequestDetailForStaff: RouteHandler<RedistributionRoutes["getRequestDetailForStaff"]> = async (c) => {
  const now = new Date().toISOString();
  const userId = (c.var as any).currentUser?.userId ?? "";
  const detail: RedistributionContracts.RedistributionRequestDetail = {
    id: uuidv7(),
    reason: "Sample redistribution",
    requestedQuantity: undefined,
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
      message: "Redistribution request details fetched successfully",
      result: detail,
    },
    200,
  );
};

export const RedistributionStaffController = {
  getRequestListForStaff,
  getRequestDetailForStaff,
} as const;
