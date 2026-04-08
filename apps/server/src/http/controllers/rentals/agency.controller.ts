import type { RouteHandler } from "@hono/zod-openapi";
import type { RentalsContracts } from "@mebike/shared";

import { Effect, Match } from "effect";

import {
  RentalRepository,
} from "@/domain/rentals";
import {
  staffApproveBikeSwapRequest,
  staffGetChangeBikeDetail,
  staffRejectBikeSwapRequest,
} from "@/domain/rentals/services/staff-rental.service";
import { withLoggedCause } from "@/domain/shared";
import {
  toContractBikeSwapRequestDetail,
} from "@/http/presenters/rentals.presenter";
import { toContractPage } from "@/http/shared/pagination";

import type { RentalsRoutes } from "./shared";

import {
  BikeSwapRequestErrorCodeSchema,
  bikeSwapRequestErrorMessages,
} from "./shared";

const agencyListBikeSwapRequests: RouteHandler<
  RentalsRoutes["agencyListBikeSwapRequests"]
> = async (c) => {
  const userId = c.var.currentUser!.userId;
  const query = c.req.valid("query");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const repo = yield* RentalRepository;
      return yield* repo.staffListBikeSwapRequests(
        userId,
        {
          userId: query.userId,
          status: query.status,
        },
        {
          page: Number(query.page ?? 1),
          pageSize: Number(query.pageSize ?? 50),
          sortBy: (query.sortBy as any) ?? "createdAt",
          sortDir: query.sortDir ?? "desc",
        },
      );
    }),
    "GET /v1/agency/bike-swap-requests",
  );

  const value = await c.var.runPromise(eff);
  const response: RentalsContracts.BikeSwapRequestListResponse = {
    data: value.items.map(toContractBikeSwapRequestDetail),
    pagination: toContractPage(value),
  };
  return c.json<RentalsContracts.BikeSwapRequestListResponse, 200>(
    response,
    200,
  );
};

const agencyGetBikeSwapRequests: RouteHandler<
  RentalsRoutes["agencyGetBikeSwapRequests"]
> = async (c) => {
  const userId = c.var.currentUser!.userId;
  const { bikeSwapRequestId } = c.req.valid("param");

  const eff = withLoggedCause(
    staffGetChangeBikeDetail(userId, bikeSwapRequestId),
    "GET /v1/agency/bike-swap-requests/{bikeSwapRequestId}",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) => {
      const response: RentalsContracts.BikeSwapRequestDetailResponse = {
        message: "ok",
        result: toContractBikeSwapRequestDetail(right),
      };
      return c.json<RentalsContracts.BikeSwapRequestDetailResponse, 200>(
        response,
        200,
      );
    }),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("StaffBikeRequestNotFound", () =>
          c.json(
            {
              error: bikeSwapRequestErrorMessages.BIKE_SWAP_REQUEST_NOT_FOUND,
              details: {
                code: BikeSwapRequestErrorCodeSchema.enum
                  .BIKE_SWAP_REQUEST_NOT_FOUND,
                bikeSwapRequestId,
              },
            },
            404,
          )),

        Match.orElse((e) => {
          throw e;
        }),
      )),
    Match.exhaustive,
  );
};

const agencyApproveBikeSwapRequestHandler: RouteHandler<
  RentalsRoutes["agencyApproveBikeSwapRequest"]
> = async (c) => {
  const userId = c.var.currentUser!.userId;
  const { bikeSwapRequestId } = c.req.valid("param");

  const eff = withLoggedCause(
    staffApproveBikeSwapRequest(userId, bikeSwapRequestId),
    "POST /v1/agency/bike-swap-requests/{bikeSwapRequestId}/approve",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) => {
      const response: RentalsContracts.BikeSwapRequestDetailResponse = {
        message: "ok",
        result: toContractBikeSwapRequestDetail(right),
      };
      return c.json<RentalsContracts.BikeSwapRequestDetailResponse, 200>(
        response,
        200,
      );
    }),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("BikeSwapRequestNotFound", error =>
          c.json(
            {
              error: bikeSwapRequestErrorMessages.BIKE_SWAP_REQUEST_NOT_FOUND,
              details: {
                code: BikeSwapRequestErrorCodeSchema.enum
                  .BIKE_SWAP_REQUEST_NOT_FOUND,
                bikeSwapRequestId: error.bikeSwapRequestId,
              },
            },
            404,
          )),
        Match.tag("StaffBikeRequestNotFound", () =>
          c.json(
            {
              error: bikeSwapRequestErrorMessages.BIKE_SWAP_REQUEST_NOT_FOUND,
              details: {
                code: BikeSwapRequestErrorCodeSchema.enum
                  .BIKE_SWAP_REQUEST_NOT_FOUND,
                bikeSwapRequestId,
              },
            },
            404,
          )),
        Match.tag("NoAvailableBike", () =>
          c.json(
            {
              error: bikeSwapRequestErrorMessages.NO_AVAILABLE_BIKE,
              details: {
                code: BikeSwapRequestErrorCodeSchema.enum.NO_AVAILABLE_BIKE,
              },
            },
            400,
          )),
        Match.tag("InvalidBikeSwapRequestStatus", error =>
          c.json(
            {
              error:
                bikeSwapRequestErrorMessages.INVALID_BIKE_SWAP_REQUEST_STATUS,
              details: {
                code: BikeSwapRequestErrorCodeSchema.enum
                  .INVALID_BIKE_SWAP_REQUEST_STATUS,
                currentStatus: error.status,
              },
            },
            400,
          )),
        Match.orElse((e) => {
          throw e;
        }),
      )),
    Match.exhaustive,
  );
};

const agencyRejectBikeSwapRequestHandler: RouteHandler<
  RentalsRoutes["agencyRejectBikeSwapRequest"]
> = async (c) => {
  const userId = c.var.currentUser!.userId;
  const { bikeSwapRequestId } = c.req.valid("param");
  const body = c.req.valid("json");

  const eff = withLoggedCause(
    staffRejectBikeSwapRequest(userId, bikeSwapRequestId, body.reason),
    "POST /v1/agency/bike-swap-requests/{bikeSwapRequestId}/reject",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) => {
      const response: RentalsContracts.BikeSwapRequestDetailResponse = {
        message: "ok",
        result: toContractBikeSwapRequestDetail(right),
      };
      return c.json<RentalsContracts.BikeSwapRequestDetailResponse, 200>(
        response,
        200,
      );
    }),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("StaffBikeRequestNotFound", () =>
          c.json(
            {
              error: bikeSwapRequestErrorMessages.BIKE_SWAP_REQUEST_NOT_FOUND,
              details: {
                code: BikeSwapRequestErrorCodeSchema.enum
                  .BIKE_SWAP_REQUEST_NOT_FOUND,
                bikeSwapRequestId,
              },
            },
            404,
          )),
        Match.tag("BikeSwapRequestNotFound", error =>
          c.json(
            {
              error: bikeSwapRequestErrorMessages.BIKE_SWAP_REQUEST_NOT_FOUND,
              details: {
                code: BikeSwapRequestErrorCodeSchema.enum
                  .BIKE_SWAP_REQUEST_NOT_FOUND,
                bikeSwapRequestId: error.bikeSwapRequestId,
              },
            },
            404,
          )),
        Match.tag("InvalidBikeSwapRequestStatus", error =>
          c.json(
            {
              error:
                bikeSwapRequestErrorMessages.INVALID_BIKE_SWAP_REQUEST_STATUS,
              details: {
                code: BikeSwapRequestErrorCodeSchema.enum
                  .INVALID_BIKE_SWAP_REQUEST_STATUS,
                currentStatus: error.status,
              },
            },
            400,
          )),
        Match.orElse((e) => {
          throw e;
        }),
      )),
    Match.exhaustive,
  );
};

export const RentalAgencyController = {
  agencyListBikeSwapRequests,
  agencyGetBikeSwapRequests,
  agencyApproveBikeSwapRequestHandler,
  agencyRejectBikeSwapRequestHandler,
} as const;
