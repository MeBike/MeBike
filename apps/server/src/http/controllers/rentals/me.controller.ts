import type { RouteHandler } from "@hono/zod-openapi";
import type { RentalsContracts } from "@mebike/shared";

import {
  BikeSwapRequestErrorCodeSchema,
  bikeSwapRequestErrorMessages,
} from "@mebike/shared";
import { Effect, Match, Option } from "effect";

import {
  RentalBillingPreviewServiceTag,
  RentalCommandServiceTag,
  RentalServiceTag,
  startRental,
} from "@/domain/rentals";
import { withLoggedCause } from "@/domain/shared";
import {
  toContractBikeSwapRequest,
  toContractBikeSwapRequestDetail,
  toContractRental,
  toContractRentalBillingPreview,
  toContractRentalWithPrice,
  toContractReturnSlot,
} from "@/http/presenters/rentals.presenter";
import { toContractPage } from "@/http/shared/pagination";

import type { RentalsRoutes } from "./shared";

import { RentalErrorCodeSchema, rentalErrorMessages } from "./shared";

const createRental: RouteHandler<RentalsRoutes["createRental"]> = async (c) => {
  const userId = c.var.currentUser!.userId;
  const body = c.req.valid("json");

  const eff = withLoggedCause(
    startRental({
      userId,
      bikeId: body.bikeId,
      startStationId: body.startStationId,
      startTime: new Date(),
      subscriptionId: body.subscriptionId,
    }),
    "POST /v1/rentals",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<RentalsContracts.RentalWithPrice, 200>(
        toContractRentalWithPrice(right),
        200,
      )),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("ActiveRentalExists", () =>
          c.json<RentalsContracts.RentalErrorResponse, 400>(
            {
              error: rentalErrorMessages.CARD_RENTAL_ACTIVE_EXISTS,
              details: {
                code: RentalErrorCodeSchema.enum.CARD_RENTAL_ACTIVE_EXISTS,
              },
            },
            400,
          )),
        Match.tag("BikeNotFound", ({ bikeId }) =>
          c.json<RentalsContracts.RentalErrorResponse, 400>(
            {
              error: rentalErrorMessages.BIKE_NOT_FOUND,
              details: {
                code: RentalErrorCodeSchema.enum.BIKE_NOT_FOUND,
                bikeId,
              },
            },
            400,
          )),
        Match.tag("BikeMissingStation", ({ bikeId }) =>
          c.json<RentalsContracts.RentalErrorResponse, 400>(
            {
              error: rentalErrorMessages.BIKE_MISSING_STATION,
              details: {
                code: RentalErrorCodeSchema.enum.BIKE_MISSING_STATION,
                bikeId,
              },
            },
            400,
          )),
        Match.tag("BikeNotFoundInStation", ({ bikeId, stationId }) =>
          c.json<RentalsContracts.RentalErrorResponse, 400>(
            {
              error: rentalErrorMessages.BIKE_NOT_FOUND_IN_STATION,
              details: {
                code: RentalErrorCodeSchema.enum.BIKE_NOT_FOUND_IN_STATION,
                bikeId,
                stationId,
              },
            },
            400,
          )),
        Match.tag("BikeAlreadyRented", () =>
          c.json<RentalsContracts.RentalErrorResponse, 400>(
            {
              error: rentalErrorMessages.BIKE_IN_USE,
              details: { code: RentalErrorCodeSchema.enum.BIKE_IN_USE },
            },
            400,
          )),
        Match.tag("BikeIsBroken", () =>
          c.json<RentalsContracts.RentalErrorResponse, 400>(
            {
              error: rentalErrorMessages.BIKE_IS_BROKEN,
              details: { code: RentalErrorCodeSchema.enum.BIKE_IS_BROKEN },
            },
            400,
          )),
        Match.tag("BikeIsMaintained", () =>
          c.json<RentalsContracts.RentalErrorResponse, 400>(
            {
              error: rentalErrorMessages.BIKE_IS_MAINTAINED,
              details: { code: RentalErrorCodeSchema.enum.BIKE_IS_MAINTAINED },
            },
            400,
          )),
        Match.tag("BikeIsReserved", () =>
          c.json<RentalsContracts.RentalErrorResponse, 400>(
            {
              error: rentalErrorMessages.BIKE_IS_RESERVED,
              details: { code: RentalErrorCodeSchema.enum.BIKE_IS_RESERVED },
            },
            400,
          )),
        Match.tag("BikeUnavailable", () =>
          c.json<RentalsContracts.RentalErrorResponse, 400>(
            {
              error: rentalErrorMessages.UNAVAILABLE_BIKE,
              details: { code: RentalErrorCodeSchema.enum.UNAVAILABLE_BIKE },
            },
            400,
          )),
        Match.tag("InvalidBikeStatus", ({ status }) =>
          c.json<RentalsContracts.RentalErrorResponse, 400>(
            {
              error: rentalErrorMessages.INVALID_BIKE_STATUS,
              details: {
                code: RentalErrorCodeSchema.enum.INVALID_BIKE_STATUS,
                bikeStatus: status,
              },
            },
            400,
          )),
        Match.tag("UserWalletNotFound", ({ userId: missingUserId }) =>
          c.json<RentalsContracts.RentalErrorResponse, 400>(
            {
              error: rentalErrorMessages.USER_NOT_HAVE_WALLET,
              details: {
                code: RentalErrorCodeSchema.enum.USER_NOT_HAVE_WALLET,
                userId: missingUserId,
              },
            },
            400,
          )),
        Match.tag(
          "InsufficientBalanceToRent",
          ({ requiredBalance, currentBalance }) =>
            c.json<RentalsContracts.RentalErrorResponse, 400>(
              {
                error: rentalErrorMessages.NOT_ENOUGH_BALANCE_TO_RENT,
                details: {
                  code: RentalErrorCodeSchema.enum.NOT_ENOUGH_BALANCE_TO_RENT,
                  requiredBalance,
                  currentBalance,
                },
              },
              400,
            ),
        ),
        Match.tag("SubscriptionNotFound", ({ subscriptionId }) =>
          c.json<RentalsContracts.RentalErrorResponse, 400>(
            {
              error: rentalErrorMessages.SUBSCRIPTION_NOT_FOUND,
              details: {
                code: RentalErrorCodeSchema.enum.SUBSCRIPTION_NOT_FOUND,
                subscriptionId,
              },
            },
            400,
          )),
        Match.tag("SubscriptionNotUsable", ({ subscriptionId, status }) =>
          c.json<RentalsContracts.RentalErrorResponse, 400>(
            {
              error: rentalErrorMessages.SUBSCRIPTION_NOT_USABLE,
              details: {
                code: RentalErrorCodeSchema.enum.SUBSCRIPTION_NOT_USABLE,
                subscriptionId,
                status,
              },
            },
            400,
          )),
        Match.tag(
          "SubscriptionUsageExceeded",
          ({ subscriptionId, usageCount, maxUsages }) =>
            c.json<RentalsContracts.RentalErrorResponse, 400>(
              {
                error: rentalErrorMessages.SUBSCRIPTION_USAGE_EXCEEDED,
                details: {
                  code: RentalErrorCodeSchema.enum.SUBSCRIPTION_USAGE_EXCEEDED,
                  subscriptionId,
                  usageCount,
                  maxUsages,
                },
              },
              400,
            ),
        ),
        Match.orElse(() => {
          throw left;
        }),
      )),
    Match.exhaustive,
  );
};

const getMyRentals: RouteHandler<RentalsRoutes["getMyRentals"]> = async (c) => {
  const userId = c.var.currentUser!.userId;
  const query = c.req.valid("query");
  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* RentalServiceTag;
      return yield* service.listMyRentals(
        userId,
        {
          status: query.status,
          startStationId: query.startStation,
          endStationId: query.endStation,
        },
        {
          page: Number(query.page ?? 1),
          pageSize: Number(query.pageSize ?? 50),
          sortBy: "startTime",
          sortDir: "desc",
        },
      );
    }),
    "GET /v1/rentals/me",
  );

  const value = await c.var.runPromise(eff);
  const response: RentalsContracts.MyRentalListResponse = {
    data: value.items.map(toContractRental),
    pagination: toContractPage(value),
  };
  return c.json<RentalsContracts.MyRentalListResponse, 200>(response, 200);
};

const getMyCurrentRentals: RouteHandler<
  RentalsRoutes["getMyCurrentRentals"]
> = async (c) => {
  const userId = c.var.currentUser!.userId;
  const query = c.req.valid("query");
  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* RentalServiceTag;
      return yield* service.listMyCurrentRentals(userId, {
        page: Number(query.page ?? 1),
        pageSize: Number(query.pageSize ?? 50),
        sortBy: "startTime",
        sortDir: "desc",
      });
    }),
    "GET /v1/rentals/me/current",
  );

  const value = await c.var.runPromise(eff);
  const response: RentalsContracts.MyRentalListResponse = {
    data: value.items.map(toContractRental),
    pagination: toContractPage(value),
  };
  return c.json<RentalsContracts.MyRentalListResponse, 200>(response, 200);
};

const getMyRental: RouteHandler<RentalsRoutes["getMyRental"]> = async (c) => {
  const userId = c.var.currentUser!.userId;
  const { rentalId } = c.req.valid("param");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* RentalServiceTag;
      return yield* service.getMyRentalById(userId, rentalId);
    }),
    "GET /v1/rentals/me/{rentalId}",
  );

  const result = await c.var.runPromise(eff);
  if (Option.isSome(result)) {
    return c.json(toContractRental(result.value), 200);
  }

  return c.json(
    {
      error: rentalErrorMessages.RENTAL_NOT_FOUND,
      details: {
        code: RentalErrorCodeSchema.enum.RENTAL_NOT_FOUND,
        rentalId,
      },
    },
    404,
  );
};

const getMyRentalBillingPreview: RouteHandler<
  RentalsRoutes["getMyRentalBillingPreview"]
> = async (c) => {
  const userId = c.var.currentUser!.userId;
  const { rentalId } = c.req.valid("param");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* RentalBillingPreviewServiceTag;
      return yield* service.previewForUser({
        rentalId,
        userId,
        previewedAt: new Date(),
      });
    }),
    "GET /v1/rentals/me/{rentalId}/billing-preview",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<RentalsContracts.RentalBillingPreview, 200>(
        toContractRentalBillingPreview(right),
        200,
      )),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("RentalNotFound", () =>
          c.json<RentalsContracts.RentalErrorResponse, 404>(
            {
              error: rentalErrorMessages.RENTAL_NOT_FOUND,
              details: {
                code: RentalErrorCodeSchema.enum.RENTAL_NOT_FOUND,
                rentalId,
              },
            },
            404,
          )),
        Match.tag("BillingPreviewRequiresActiveRental", ({ status }) =>
          c.json<RentalsContracts.RentalErrorResponse, 400>(
            {
              error: rentalErrorMessages.BILLING_PREVIEW_REQUIRES_ACTIVE_RENTAL,
              details: {
                code: RentalErrorCodeSchema.enum.BILLING_PREVIEW_REQUIRES_ACTIVE_RENTAL,
                rentalId,
                status,
              },
            },
            400,
          )),
        Match.tag("SubscriptionNotFound", ({ subscriptionId }) =>
          c.json<RentalsContracts.RentalErrorResponse, 400>(
            {
              error: rentalErrorMessages.SUBSCRIPTION_NOT_FOUND,
              details: {
                code: RentalErrorCodeSchema.enum.SUBSCRIPTION_NOT_FOUND,
                rentalId,
                subscriptionId,
              },
            },
            400,
          )),
        Match.tag("SubscriptionNotUsable", ({ subscriptionId, status }) =>
          c.json<RentalsContracts.RentalErrorResponse, 400>(
            {
              error: rentalErrorMessages.SUBSCRIPTION_NOT_USABLE,
              details: {
                code: RentalErrorCodeSchema.enum.SUBSCRIPTION_NOT_USABLE,
                rentalId,
                subscriptionId,
                status,
              },
            },
            400,
          )),
        Match.orElse(err => {
          throw err;
        }),
      )),
    Match.exhaustive,
  );
};

const getMyRentalCounts: RouteHandler<
  RentalsRoutes["getMyRentalCounts"]
> = async (c) => {
  const userId = c.var.currentUser!.userId;
  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* RentalServiceTag;
      return yield* service.getMyRentalCounts(userId);
    }),
    "GET /v1/rentals/me/counts",
  );

  const result = await c.var.runPromise(eff);
  return c.json<RentalsContracts.RentalCountsResponse, 200>(result, 200);
};

const createMyReturnSlot: RouteHandler<
  RentalsRoutes["createMyReturnSlot"]
> = async (c) => {
  const userId = c.var.currentUser!.userId;
  const { rentalId } = c.req.valid("param");
  const body = c.req.valid("json");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* RentalCommandServiceTag;
      return yield* service.createReturnSlot({
        rentalId,
        userId,
        stationId: body.stationId,
        now: new Date(),
      });
    }),
    "POST /v1/rentals/me/{rentalId}/return-slot",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json(toContractReturnSlot(right), 200)),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("RentalNotFound", () =>
          c.json(
            {
              error: rentalErrorMessages.RENTAL_NOT_FOUND,
              details: {
                code: RentalErrorCodeSchema.enum.RENTAL_NOT_FOUND,
                rentalId,
              },
            },
            404,
          )),
        Match.tag("StationNotFound", () =>
          c.json(
            {
              error: rentalErrorMessages.STATION_NOT_FOUND,
              details: {
                code: RentalErrorCodeSchema.enum.STATION_NOT_FOUND,
                stationId: body.stationId,
              },
            },
            404,
          )),
        Match.tag("ReturnSlotRequiresActiveRental", ({ status }) =>
          c.json(
            {
              error: rentalErrorMessages.RETURN_SLOT_REQUIRES_ACTIVE_RENTAL,
              details: {
                code: RentalErrorCodeSchema.enum
                  .RETURN_SLOT_REQUIRES_ACTIVE_RENTAL,
                rentalId,
                status,
              },
            },
            400,
          )),
        Match.tag(
          "ReturnSlotCapacityExceeded",
          ({
            stationId,
            totalCapacity,
            returnSlotLimit,
            totalBikes,
            activeReturnSlots,
          }) =>
            c.json(
              {
                error: rentalErrorMessages.RETURN_SLOT_CAPACITY_EXCEEDED,
                details: {
                  code: RentalErrorCodeSchema.enum
                    .RETURN_SLOT_CAPACITY_EXCEEDED,
                  stationId,
                  totalCapacity,
                  returnSlotLimit,
                  totalBikes,
                  activeReturnSlots,
                },
              },
              400,
            ),
        ),
        Match.orElse(() => {
          throw left;
        }),
      )),
    Match.exhaustive,
  );
};

const getMyCurrentReturnSlot: RouteHandler<
  RentalsRoutes["getMyCurrentReturnSlot"]
> = async (c) => {
  const userId = c.var.currentUser!.userId;
  const { rentalId } = c.req.valid("param");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* RentalCommandServiceTag;
      return yield* service.getCurrentReturnSlot({
        rentalId,
        userId,
      });
    }),
    "GET /v1/rentals/me/{rentalId}/return-slot",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) => {
      if (Option.isSome(right)) {
        return c.json(toContractReturnSlot(right.value), 200);
      }

      return c.json(
        {
          error: rentalErrorMessages.RETURN_SLOT_NOT_FOUND,
          details: {
            code: RentalErrorCodeSchema.enum.RETURN_SLOT_NOT_FOUND,
            rentalId,
            userId,
          },
        },
        404,
      );
    }),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("RentalNotFound", () =>
          c.json(
            {
              error: rentalErrorMessages.RENTAL_NOT_FOUND,
              details: {
                code: RentalErrorCodeSchema.enum.RENTAL_NOT_FOUND,
                rentalId,
              },
            },
            404,
          )),
        Match.tag("ReturnSlotRequiresActiveRental", ({ status }) =>
          c.json(
            {
              error: rentalErrorMessages.RETURN_SLOT_REQUIRES_ACTIVE_RENTAL,
              details: {
                code: RentalErrorCodeSchema.enum
                  .RETURN_SLOT_REQUIRES_ACTIVE_RENTAL,
                rentalId,
                status,
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

const cancelMyReturnSlot: RouteHandler<
  RentalsRoutes["cancelMyReturnSlot"]
> = async (c) => {
  const userId = c.var.currentUser!.userId;
  const { rentalId } = c.req.valid("param");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* RentalCommandServiceTag;
      return yield* service.cancelReturnSlot({
        rentalId,
        userId,
        now: new Date(),
      });
    }),
    "DELETE /v1/rentals/me/{rentalId}/return-slot",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json(toContractReturnSlot(right), 200)),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("RentalNotFound", () =>
          c.json(
            {
              error: rentalErrorMessages.RENTAL_NOT_FOUND,
              details: {
                code: RentalErrorCodeSchema.enum.RENTAL_NOT_FOUND,
                rentalId,
              },
            },
            404,
          )),
        Match.tag("ReturnSlotNotFound", () =>
          c.json(
            {
              error: rentalErrorMessages.RETURN_SLOT_NOT_FOUND,
              details: {
                code: RentalErrorCodeSchema.enum.RETURN_SLOT_NOT_FOUND,
                rentalId,
                userId,
              },
            },
            404,
          )),
        Match.tag("ReturnSlotRequiresActiveRental", ({ status }) =>
          c.json(
            {
              error: rentalErrorMessages.RETURN_SLOT_REQUIRES_ACTIVE_RENTAL,
              details: {
                code: RentalErrorCodeSchema.enum
                  .RETURN_SLOT_REQUIRES_ACTIVE_RENTAL,
                rentalId,
                status,
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

const requestBikeSwap: RouteHandler<RentalsRoutes["requestBikeSwap"]> = async (
  c,
) => {
  const userId = c.var.currentUser!.userId;
  const { rentalId } = c.req.valid("param");
  const body = c.req.valid("json");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* RentalServiceTag;
      return yield* service.requestBikeSwap({
        userId,
        rentalId,
        stationId: body.stationId,
      });
    }),
    "POST /v1/rentals/{rentalId}/request-bike-swap",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<RentalsContracts.BikeSwapRequestResponse, 200>(
        {
          message: "Bike swap requested successfully",
          result: toContractBikeSwapRequest(right),
        },
        200,
      )),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("RentalNotFound", () =>
          c.json(
            {
              error: rentalErrorMessages.RENTAL_NOT_FOUND,
              details: { code: RentalErrorCodeSchema.enum.RENTAL_NOT_FOUND },
            },
            404,
          )),
        Match.tag("UnauthorizedRentalAccess", () =>
          c.json(
            {
              error: rentalErrorMessages.ACCESS_DENIED,
              details: { code: RentalErrorCodeSchema.enum.ACCESS_DENIED },
            },
            403,
          )),
        Match.tag("CannotRequestSwap", ({ status }) =>
          c.json(
            {
              error:
                rentalErrorMessages.CANNOT_REQUEST_SWAP_THIS_RENTAL_WITH_STATUS,
              details: {
                code: RentalErrorCodeSchema.enum
                  .CANNOT_REQUEST_SWAP_THIS_RENTAL_WITH_STATUS,
                status,
              },
            },
            400,
          )),
        Match.tag("StationNotFound", () =>
          c.json(
            {
              error: rentalErrorMessages.STATION_NOT_FOUND,
              details: { code: RentalErrorCodeSchema.enum.STATION_NOT_FOUND },
            },
            404,
          )),
        Match.tag("BikeSwapRequestExisted", () =>
          c.json(
            {
              error: rentalErrorMessages.BIKE_SWAP_REQUEST_ALREADY_PENDING,
              details: {
                code: RentalErrorCodeSchema.enum
                  .BIKE_SWAP_REQUEST_ALREADY_PENDING,
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

const getMyBikeSwapRequests: RouteHandler<
  RentalsRoutes["getMyBikeSwapRequests"]
> = async (c) => {
  const userId = c.var.currentUser!.userId;
  const query = c.req.valid("query");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* RentalServiceTag;
      return yield* service.getMyBikeSwapRequests(
        {
          rentalId: query.rentalId,
          userId,
          status: query.status,
        },
        {
          page: Number(query.page ?? 1),
          pageSize: Number(query.pageSize ?? 50),
          sortBy: "createdAt",
          sortDir: "desc",
        },
      );
    }),
    "GET /v1/rentals/me/bike-swap-requests",
  );

  const result = await c.var.runPromise(eff);
  const response: RentalsContracts.BikeSwapRequestListResponse = {
    data: result.items.map(toContractBikeSwapRequestDetail),
    pagination: toContractPage(result),
  };

  return c.json<RentalsContracts.BikeSwapRequestListResponse, 200>(
    response,
    200,
  );
};

const getMyBikeSwapRequest: RouteHandler<
  RentalsRoutes["getMyBikeSwapRequest"]
> = async (c) => {
  const userId = c.var.currentUser!.userId;
  const { bikeSwapRequestId } = c.req.valid("param");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* RentalServiceTag;
      return yield* service.getMyBikeSwapRequest(userId, bikeSwapRequestId);
    }),
    "GET /v1/rentals/me/bike-swap-requests/{bikeSwapRequestId}",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) => {
      const response: RentalsContracts.BikeSwapRequestDetailResponse = {
        message: "Bike swap request fetched successfully",
        result: toContractBikeSwapRequestDetail(right),
      };
      return c.json<RentalsContracts.BikeSwapRequestDetailResponse, 200>(
        response,
        200,
      );
    }),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("BikeSwapRequestNotFound", () =>
          c.json(
            {
              error: bikeSwapRequestErrorMessages.BIKE_SWAP_REQUEST_NOT_FOUND,
              details: {
                code: BikeSwapRequestErrorCodeSchema.enum
                  .BIKE_SWAP_REQUEST_NOT_FOUND,
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

export const RentalMeController = {
  cancelMyReturnSlot,
  createRental,
  createMyReturnSlot,
  getMyRentals,
  getMyCurrentRentals,
  getMyCurrentReturnSlot,
  getMyRental,
  getMyRentalBillingPreview,
  getMyRentalCounts,
  requestBikeSwap,
  getMyBikeSwapRequests,
  getMyBikeSwapRequest,
} as const;
