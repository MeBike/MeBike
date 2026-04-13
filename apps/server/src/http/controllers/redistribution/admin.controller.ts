import type { RouteHandler } from "@hono/zod-openapi";
import type { RedistributionContracts } from "@mebike/shared";

import { Effect, Match, Option } from "effect";

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

const getRequestListForAdmin: RouteHandler<
  RedistributionRoutes["getRequestListForAdmin"]
> = async (c) => {
  const query = c.req.valid("query");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* RedistributionServiceTag;
      return yield* service.adminListRequests(
        {
          status: query.status,
          requestedByUserId: query.requestedByUserId,
          approvedByUserId: query.approvedByUserId,
          sourceStationId: query.sourceStationId,
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
    "GET /v1/admin/redistribution-requests",
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
    Match.tag("Left", ({ left }) => {
      throw left;
    }),
    Match.exhaustive,
  );
};

const getRequestDetailForAdmin: RouteHandler<
  RedistributionRoutes["getRequestDetailForAdmin"]
> = async (c) => {
  const { requestId } = c.req.valid("param");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* RedistributionServiceTag;
      return yield* service.adminGetById(requestId);
    }),
    "GET /v1/admin/redistribution-requests/{requestId}",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) => {
      if (Option.isNone(right)) {
        return c.json<RedistributionContracts.RedistributionReqErrorResponse, 404>(
          {
            error: redistributionReqErrorMessages.REDISTRIBUTION_REQUEST_NOT_FOUND,
            details: {
              code: RedistributionReqErrorCodeSchema.enum.REDISTRIBUTION_REQUEST_NOT_FOUND,
              requestId,
            },
          },
          404,
        );
      }
      return c.json(
        {
          message: "Redistribution request fetched successfully",
          result: toContractRedistributionRequestDetail(right.value),
        },
        200,
      );
    }),
    Match.tag("Left", ({ left }) => {
      throw left;
    }),
    Match.exhaustive,
  );
};

export const RedistributionAdminController = {
  getRequestListForAdmin,
  getRequestDetailForAdmin,
} as const;
