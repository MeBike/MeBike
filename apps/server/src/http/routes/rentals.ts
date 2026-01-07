import { RentalsContracts, serverRoutes } from "@mebike/shared";
import { Effect, Match, Option } from "effect";

import {
  endRentalUseCase,
  RentalServiceTag,
  startRentalUseCase,
} from "@/domain/rentals";
import { withLoggedCause } from "@/domain/shared";
import { toContractPage } from "@/http/shared/pagination";
import { withRentalDeps } from "@/http/shared/providers";

const {
  RentalErrorCodeSchema,
  rentalErrorMessages,
} = RentalsContracts;

function toContractRental(
  row: import("@/domain/rentals").RentalRow,
): RentalsContracts.MyRentalListResponse["data"][number] {
  return {
    id: row.id,
    userId: row.userId,
    bikeId: row.bikeId ?? undefined,
    startStation: row.startStationId,
    endStation: row.endStationId ?? undefined,
    startTime: row.startTime.toISOString(),
    endTime: row.endTime ? row.endTime.toISOString() : undefined,
    duration: row.durationMinutes ?? 0,
    totalPrice: row.totalPrice ?? undefined,
    subscriptionId: row.subscriptionId ?? undefined,
    status: row.status,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toContractRentalWithPrice(
  row: import("@/domain/rentals").RentalRow,
): RentalsContracts.RentalWithPrice {
  return {
    id: row.id,
    userId: row.userId,
    bikeId: row.bikeId ?? undefined,
    startStation: row.startStationId,
    endStation: row.endStationId ?? undefined,
    startTime: row.startTime.toISOString(),
    endTime: row.endTime ? row.endTime.toISOString() : undefined,
    duration: row.durationMinutes ?? 0,
    totalPrice: row.totalPrice ?? 0,
    subscriptionId: row.subscriptionId ?? undefined,
    status: row.status,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function registerRentalRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const rentals = serverRoutes.rentals;

  app.openapi(rentals.createRental, async (c) => {
    const userId = c.var.currentUser!.userId;
    const body = c.req.valid("json");

    const eff = withLoggedCause(
      withRentalDeps(startRentalUseCase({
        userId,
        bikeId: body.bikeId,
        startStationId: body.startStationId,
        startTime: new Date(),
        subscriptionId: body.subscriptionId,
      })),
      "POST /v1/rentals",
    );

    const result = await Effect.runPromise(eff.pipe(Effect.either));

    return Match.value(result).pipe(
      Match.tag("Right", ({ right }) =>
        c.json<RentalsContracts.CreateRentalResponse, 200>({
          message: "Rental created successfully",
          result: toContractRentalWithPrice(right),
        }, 200)),
      Match.tag("Left", ({ left }) =>
        Match.value(left).pipe(
          Match.tag("ActiveRentalExists", () =>
            c.json<RentalsContracts.RentalErrorResponse, 400>({
              error: rentalErrorMessages.CARD_RENTAL_ACTIVE_EXISTS,
              details: { code: RentalErrorCodeSchema.enum.CARD_RENTAL_ACTIVE_EXISTS },
            }, 400)),
          Match.tag("BikeNotFound", ({ bikeId }) =>
            c.json<RentalsContracts.RentalErrorResponse, 400>({
              error: rentalErrorMessages.BIKE_NOT_FOUND,
              details: { code: RentalErrorCodeSchema.enum.BIKE_NOT_FOUND, bikeId },
            }, 400)),
          Match.tag("BikeMissingStation", ({ bikeId }) =>
            c.json<RentalsContracts.RentalErrorResponse, 400>({
              error: rentalErrorMessages.BIKE_MISSING_STATION,
              details: { code: RentalErrorCodeSchema.enum.BIKE_MISSING_STATION, bikeId },
            }, 400)),
          Match.tag("BikeNotFoundInStation", ({ bikeId, stationId }) =>
            c.json<RentalsContracts.RentalErrorResponse, 400>({
              error: rentalErrorMessages.BIKE_NOT_FOUND_IN_STATION,
              details: {
                code: RentalErrorCodeSchema.enum.BIKE_NOT_FOUND_IN_STATION,
                bikeId,
                stationId,
              },
            }, 400)),
          Match.tag("BikeAlreadyRented", () =>
            c.json<RentalsContracts.RentalErrorResponse, 400>({
              error: rentalErrorMessages.BIKE_IN_USE,
              details: { code: RentalErrorCodeSchema.enum.BIKE_IN_USE },
            }, 400)),
          Match.tag("BikeIsBroken", () =>
            c.json<RentalsContracts.RentalErrorResponse, 400>({
              error: rentalErrorMessages.BIKE_IS_BROKEN,
              details: { code: RentalErrorCodeSchema.enum.BIKE_IS_BROKEN },
            }, 400)),
          Match.tag("BikeIsMaintained", () =>
            c.json<RentalsContracts.RentalErrorResponse, 400>({
              error: rentalErrorMessages.BIKE_IS_MAINTAINED,
              details: { code: RentalErrorCodeSchema.enum.BIKE_IS_MAINTAINED },
            }, 400)),
          Match.tag("BikeIsReserved", () =>
            c.json<RentalsContracts.RentalErrorResponse, 400>({
              error: rentalErrorMessages.BIKE_IS_RESERVED,
              details: { code: RentalErrorCodeSchema.enum.BIKE_IS_RESERVED },
            }, 400)),
          Match.tag("BikeUnavailable", () =>
            c.json<RentalsContracts.RentalErrorResponse, 400>({
              error: rentalErrorMessages.UNAVAILABLE_BIKE,
              details: { code: RentalErrorCodeSchema.enum.UNAVAILABLE_BIKE },
            }, 400)),
          Match.tag("InvalidBikeStatus", ({ status }) =>
            c.json<RentalsContracts.RentalErrorResponse, 400>({
              error: rentalErrorMessages.INVALID_BIKE_STATUS,
              details: {
                code: RentalErrorCodeSchema.enum.INVALID_BIKE_STATUS,
                bikeStatus: status,
              },
            }, 400)),
          Match.tag("UserWalletNotFound", ({ userId: missingUserId }) =>
            c.json<RentalsContracts.RentalErrorResponse, 400>({
              error: rentalErrorMessages.USER_NOT_HAVE_WALLET,
              details: {
                code: RentalErrorCodeSchema.enum.USER_NOT_HAVE_WALLET,
                userId: missingUserId,
              },
            }, 400)),
          Match.tag("InsufficientBalanceToRent", ({ requiredBalance, currentBalance }) =>
            c.json<RentalsContracts.RentalErrorResponse, 400>({
              error: rentalErrorMessages.NOT_ENOUGH_BALANCE_TO_RENT,
              details: {
                code: RentalErrorCodeSchema.enum.NOT_ENOUGH_BALANCE_TO_RENT,
                requiredBalance,
                currentBalance,
              },
            }, 400)),
          Match.tag("SubscriptionNotFound", ({ subscriptionId }) =>
            c.json<RentalsContracts.RentalErrorResponse, 400>({
              error: rentalErrorMessages.SUBSCRIPTION_NOT_FOUND,
              details: {
                code: RentalErrorCodeSchema.enum.SUBSCRIPTION_NOT_FOUND,
                subscriptionId,
              },
            }, 400)),
          Match.tag("SubscriptionNotUsable", ({ subscriptionId, status }) =>
            c.json<RentalsContracts.RentalErrorResponse, 400>({
              error: rentalErrorMessages.SUBSCRIPTION_NOT_USABLE,
              details: {
                code: RentalErrorCodeSchema.enum.SUBSCRIPTION_NOT_USABLE,
                subscriptionId,
                status,
              },
            }, 400)),
          Match.tag("SubscriptionUsageExceeded", ({ subscriptionId, usageCount, maxUsages }) =>
            c.json<RentalsContracts.RentalErrorResponse, 400>({
              error: rentalErrorMessages.SUBSCRIPTION_USAGE_EXCEEDED,
              details: {
                code: RentalErrorCodeSchema.enum.SUBSCRIPTION_USAGE_EXCEEDED,
                subscriptionId,
                usageCount,
                maxUsages,
              },
            }, 400)),
          Match.orElse(() => {
            throw left;
          }),
        )),
      Match.exhaustive,
    );
  });

  app.openapi(rentals.getMyRentals, async (c) => {
    const userId = c.var.currentUser!.userId;
    const query = c.req.valid("query");
    const eff = withLoggedCause(
      withRentalDeps(
        Effect.gen(function* () {
          const service = yield* RentalServiceTag;
          return yield* service.listMyRentals(userId, {
            status: query.status,
            startStationId: query.startStation,
            endStationId: query.endStation,
          }, {
            page: Number(query.page ?? 1),
            pageSize: Number(query.limit ?? 50),
            sortBy: "startTime",
            sortDir: "desc",
          });
        }),
      ),
      "GET /v1/rentals/me",
    );

    const value = await Effect.runPromise(eff);
    const response: RentalsContracts.MyRentalListResponse = {
      data: value.items.map(toContractRental),
      pagination: toContractPage(value),
    };
    return c.json<RentalsContracts.MyRentalListResponse, 200>(response, 200);
  });

  app.openapi(rentals.getMyCurrentRentals, async (c) => {
    const userId = c.var.currentUser!.userId;
    const query = c.req.valid("query");
    const eff = withLoggedCause(
      withRentalDeps(
        Effect.gen(function* () {
          const service = yield* RentalServiceTag;
          return yield* service.listMyCurrentRentals(userId, {
            page: Number(query.page ?? 1),
            pageSize: Number(query.limit ?? 50),
            sortBy: "startTime",
            sortDir: "desc",
          });
        }),
      ),
      "GET /v1/rentals/me/current",
    );

    const value = await Effect.runPromise(eff);
    const response: RentalsContracts.MyRentalListResponse = {
      data: value.items.map(toContractRental),
      pagination: toContractPage(value),
    };
    return c.json<RentalsContracts.MyRentalListResponse, 200>(response, 200);
  });

  app.openapi(rentals.getMyRental, async (c) => {
    const userId = c.var.currentUser!.userId;
    const { rentalId } = c.req.valid("param");

    const eff = withLoggedCause(
      withRentalDeps(
        Effect.gen(function* () {
          const service = yield* RentalServiceTag;
          return yield* service.getMyRentalById(userId, rentalId);
        }),
      ),
      "GET /v1/rentals/me/{rentalId}",
    );

    const result = await Effect.runPromise(eff);
    if (Option.isSome(result)) {
      return c.json(
        {
          message: "OK",
          result: toContractRental(result.value),
        },
        200,
      );
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
  });

  app.openapi(rentals.getMyRentalCounts, async (c) => {
    const userId = c.var.currentUser!.userId;
    const eff = withLoggedCause(
      withRentalDeps(
        Effect.gen(function* () {
          const service = yield* RentalServiceTag;
          return yield* service.getMyRentalCounts(userId);
        }),
      ),
      "GET /v1/rentals/me/counts",
    );

    const result = await Effect.runPromise(eff);
    return c.json<RentalsContracts.RentalCountsResponse, 200>(
      { message: "OK", result },
      200,
    );
  });

  app.openapi(rentals.endMyRental, async (c) => {
    const userId = c.var.currentUser!.userId;
    const { rentalId } = c.req.valid("param");
    const body = c.req.valid("json");

    const eff = withLoggedCause(
      withRentalDeps(
        endRentalUseCase({
          userId,
          rentalId,
          endStationId: body.endStation,
          endTime: new Date(),
        }),
      ),
      "PUT /v1/rentals/me/{rentalId}/end",
    );

    const result = await Effect.runPromise(eff.pipe(Effect.either));

    return Match.value(result).pipe(
      Match.tag("Right", ({ right }) =>
        c.json(
          {
            message: "Rental ended successfully",
            result: toContractRental(right),
          },
          200,
        )),
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
              400,
            )),
          Match.tag("EndStationMismatch", () =>
            c.json(
              {
                error: rentalErrorMessages.MUST_END_AT_START_STATION,
                details: {
                  code: RentalErrorCodeSchema.enum.MUST_END_AT_START_STATION,
                  rentalId,
                },
              },
              400,
            )),
          Match.tag("InvalidRentalState", () =>
            c.json(
              {
                error: rentalErrorMessages.NOT_FOUND_RENTED_RENTAL,
                details: {
                  code: RentalErrorCodeSchema.enum.NOT_FOUND_RENTED_RENTAL,
                  rentalId,
                },
              },
              400,
            )),
          Match.tag("UserWalletNotFound", ({ userId: missingUserId }) =>
            c.json<RentalsContracts.RentalErrorResponse, 400>({
              error: rentalErrorMessages.USER_NOT_HAVE_WALLET,
              details: {
                code: RentalErrorCodeSchema.enum.USER_NOT_HAVE_WALLET,
                userId: missingUserId,
              },
            }, 400)),
          Match.tag("InsufficientBalanceToRent", ({ requiredBalance, currentBalance }) =>
            c.json<RentalsContracts.RentalErrorResponse, 400>({
              error: rentalErrorMessages.NOT_ENOUGH_BALANCE_TO_RENT,
              details: {
                code: RentalErrorCodeSchema.enum.NOT_ENOUGH_BALANCE_TO_RENT,
                requiredBalance,
                currentBalance,
              },
            }, 400)),
          Match.tag("BikeAlreadyRented", () =>
            c.json(
              {
                error: rentalErrorMessages.BIKE_IN_USE,
                details: {
                  code: RentalErrorCodeSchema.enum.BIKE_IN_USE,
                },
              },
              400,
            )),
          Match.tag("ActiveRentalExists", () =>
            c.json(
              {
                error: rentalErrorMessages.CARD_RENTAL_ACTIVE_EXISTS,
                details: {
                  code: RentalErrorCodeSchema.enum.CARD_RENTAL_ACTIVE_EXISTS,
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
  });
}
