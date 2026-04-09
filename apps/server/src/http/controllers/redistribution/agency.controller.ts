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

const getRequestListForAgency: RouteHandler<
  RedistributionRoutes["getRequestListForAgency"]
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
    "GET /v1/agency/redistribution-requests",
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

const getRequestDetailForAgency: RouteHandler<
  RedistributionRoutes["getRequestDetailForAgency"]
> = async (c) => {
  const { requestId } = c.req.valid("param");
  const { userId } = c.var.currentUser!;

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* RedistributionServiceTag;
      return yield* service.getRequestInStation({ userId, requestId });
    }),
    "GET /v1/agency/redistribution-requests/{requestId}",
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

export const RedistributionAgencyController = {
  getRequestListForAgency,
  getRequestDetailForAgency,
} as const;
