import type { RouteHandler } from "@hono/zod-openapi";
import type { RentalsContracts } from "@mebike/shared";

import { Effect, Match } from "effect";

import { RentalRepository } from "@/domain/rentals";

import { withLoggedCause } from "@/domain/shared";
import {
  toContractStaffBikeSwapRequest,
  toContractStaffBikeSwapRequestDetail,
} from "@/http/presenters/rentals.presenter";
import { toContractPage } from "@/http/shared/pagination";

import type { RentalsRoutes } from "./shared";
import {
  BikeSwapRequestErrorCodeSchema,
  bikeSwapRequestErrorMessages,
} from "./shared";
import { staffGetChangeBikeDetailUseCase } from "@/domain/rentals/services/staff-rental.service";

const staffListBikeSwapRequests: RouteHandler<
  RentalsRoutes["staffListBikeSwapRequests"]
> = async (c) => {
  const query = c.req.valid("query");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const repo = yield* RentalRepository;
      return yield* repo.staffListBikeSwapRequests(
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
    "GET /v1/staff/bike-swap-requests",
  );

  const value = await c.var.runPromise(eff);
  const response: RentalsContracts.BikeSwapRequestListResponse = {
    data: value.items.map(toContractStaffBikeSwapRequest),
    pagination: toContractPage(value),
  };
  return c.json<RentalsContracts.BikeSwapRequestListResponse, 200>(
    response,
    200,
  );
};

const staffGetBikeSwapRequests: RouteHandler<
  RentalsRoutes["staffGetBikeSwapRequests"]
> = async (c) => {
  const { bikeSwapRequestId } = c.req.valid("param");

  const eff = withLoggedCause(
    staffGetChangeBikeDetailUseCase(bikeSwapRequestId),
    "GET /v1/staff/bike-swap-requests/{bikeSwapRequestId}",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) => {
      const response: RentalsContracts.BikeSwapRequestDetailResponse = {
        message: "ok",
        result: toContractStaffBikeSwapRequestDetail(right),
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
          ),
        ),

        Match.orElse((e) => {
          throw e;
        }),
      ),
    ),
    Match.exhaustive,
  );
};

export const RentalStaffController = {
  staffListBikeSwapRequests,
  staffGetBikeSwapRequests,
} as const;
