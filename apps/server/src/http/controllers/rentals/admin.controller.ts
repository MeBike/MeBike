import type { RouteHandler } from "@hono/zod-openapi";
import type { RentalsContracts } from "@mebike/shared";

import { Effect, Match } from "effect";

import {
  adminGetRentalDetailUseCase,
  RentalRepository,
} from "@/domain/rentals";
import { withLoggedCause } from "@/domain/shared";
import {
  toContractAdminRentalDetail,
  toContractAdminRentalListItem,
} from "@/http/presenters/rentals.presenter";
import { toContractPage } from "@/http/shared/pagination";

import type { RentalsRoutes } from "./shared";

import {
  RentalErrorCodeSchema,
  rentalErrorMessages,

} from "./shared";

const adminListRentals: RouteHandler<RentalsRoutes["adminListRentals"]> = async (c) => {
  const query = c.req.valid("query");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const repo = yield* RentalRepository;
      return yield* repo.adminListRentals(
        {
          userId: query.userId,
          bikeId: query.bikeId,
          startStationId: query.startStation,
          endStationId: query.endStation,
          status: query.status,
        },
        {
          page: Number(query.page ?? 1),
          pageSize: Number(query.pageSize ?? 50),
          sortBy: query.sortBy ?? "startTime",
          sortDir: query.sortDir ?? "desc",
        },
      );
    }),
    "GET /v1/admin/rentals",
  );

  const value = await c.var.runPromise(eff);
  const response: RentalsContracts.AdminRentalsListResponse = {
    data: value.items.map(toContractAdminRentalListItem),
    pagination: toContractPage(value),
  };
  return c.json<RentalsContracts.AdminRentalsListResponse, 200>(response, 200);
};

const adminGetRental: RouteHandler<RentalsRoutes["adminGetRental"]> = async (c) => {
  const { rentalId } = c.req.valid("param");

  const eff = withLoggedCause(
    adminGetRentalDetailUseCase(rentalId),
    "GET /v1/admin/rentals/{rentalId}",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) => {
      const detail = toContractAdminRentalDetail(right);
      return c.json(
        {
          message: "OK",
          result: detail,
        },
        200,
      );
    }),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("AdminRentalNotFound", () =>
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
        Match.orElse(() => {
          throw left;
        }),
      )),
    Match.exhaustive,
  );
};

export const RentalAdminController = {
  adminListRentals,
  adminGetRental,
} as const;
