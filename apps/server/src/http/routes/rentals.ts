import { RentalsContracts, serverRoutes } from "@mebike/shared";
import { Effect, Match, Option } from "effect";

import {
  endRentalUseCase,
  getMyRentalCountsUseCase,
  getMyRentalUseCase,
  listMyCurrentRentalsUseCase,
  listMyRentalsUseCase,
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
    _id: row.id,
    user_id: row.userId,
    bike_id: row.bikeId ?? undefined,
    start_station: row.startStationId,
    end_station: row.endStationId ?? undefined,
    start_time: row.startTime.toISOString(),
    end_time: row.endTime ? row.endTime.toISOString() : undefined,
    duration: row.durationMinutes ?? 0,
    total_price: row.totalPrice ?? undefined,
    status: row.status,
    created_at: row.startTime.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

export function registerRentalRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const rentals = serverRoutes.rentals;
  const userIdPlaceholder = "todo-user"; // TODO: replace with real auth or context

  app.openapi(rentals.getMyRentals, async (c) => {
    const query = c.req.valid("query");
    const eff = withLoggedCause(
      withRentalDeps(
        listMyRentalsUseCase({
          userId: userIdPlaceholder,
          filter: {
            status: query.status,
            startStationId: query.start_station,
            endStationId: query.end_station,
          },
          pageReq: {
            page: Number(query.page ?? 1),
            pageSize: Number(query.limit ?? 50),
            sortBy: "startTime",
            sortDir: "desc",
          },
        }),
      ),
      "GET /v1/rentals/me",
    );

    const value = await Effect.runPromise(eff);
    const response: RentalsContracts.MyRentalListResponse = {
      data: value.items.map(toContractRental),
      pagination: toContractPage(value),
    };
    return c.json<typeof response, 200>(response, 200);
  });

  app.openapi(rentals.getMyCurrentRentals, async (c) => {
    const query = c.req.valid("query");
    const eff = withLoggedCause(
      withRentalDeps(
        listMyCurrentRentalsUseCase(
          userIdPlaceholder,
          {
            page: Number(query.page ?? 1),
            pageSize: Number(query.limit ?? 50),
            sortBy: "startTime",
            sortDir: "desc",
          },
        ),
      ),
      "GET /v1/rentals/me/current",
    );

    const value = await Effect.runPromise(eff);
    const response: RentalsContracts.MyRentalListResponse = {
      data: value.items.map(toContractRental),
      pagination: toContractPage(value),
    };
    return c.json<typeof response, 200>(response, 200);
  });

  app.openapi(rentals.getMyRental, async (c) => {
    const { rentalId } = c.req.valid("param");

    const eff = withLoggedCause(
      withRentalDeps(getMyRentalUseCase(userIdPlaceholder, rentalId)),
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
    const eff = withLoggedCause(
      withRentalDeps(getMyRentalCountsUseCase(userIdPlaceholder)),
      "GET /v1/rentals/me/counts",
    );

    const rows = await Effect.runPromise(eff);
    const result: RentalsContracts.RentalCountsResponse["result"] = {
      RENTED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      RESERVED: 0,
    };
    for (const row of rows) {
      const key = row.status;
      if (key in result) {
        result[key as keyof typeof result] = row.count;
      }
    }

    const response: RentalsContracts.RentalCountsResponse = {
      message: "OK",
      result,
    };
    return c.json<typeof response, 200>(response, 200);
  });

  app.openapi(rentals.endMyRental, async (c) => {
    const { rentalId } = c.req.valid("param");
    const body = c.req.valid("json");

    const eff = withLoggedCause(
      withRentalDeps(
        endRentalUseCase({
          userId: userIdPlaceholder,
          rentalId,
          endStationId: body.end_station,
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
