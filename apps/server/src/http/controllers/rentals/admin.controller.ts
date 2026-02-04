import type { RouteHandler } from "@hono/zod-openapi";
import type { RentalsContracts } from "@mebike/shared";

import { Effect, Match } from "effect";

import {
  adminGetRentalDetailUseCase,
  endRentalByAdminUseCase,
  RentalRepository,
} from "@/domain/rentals";
import { withLoggedCause } from "@/domain/shared";
import {
  toContractAdminRentalDetail,
  toContractAdminRentalListItem,
  toContractRentalListItem,
} from "@/http/presenters/rentals.presenter";
import { toContractPage } from "@/http/shared/pagination";
import { notifyBikeStatusUpdate } from "@/realtime/bike-status-events";

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

const getActiveRentalsByPhone: RouteHandler<RentalsRoutes["getActiveRentalsByPhone"]> = async (c) => {
  const { number } = c.req.valid("param");
  const query = c.req.valid("query");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const repo = yield* RentalRepository;
      return yield* repo.listActiveRentalsByPhone(number, {
        page: Number(query.page ?? 1),
        pageSize: Number(query.pageSize ?? 50),
        sortBy: "startTime",
        sortDir: "desc",
      });
    }),
    "GET /v1/rentals/by-phone/{number}/active",
  );

  const value = await c.var.runPromise(eff);
  const response: RentalsContracts.RentalListResponse = {
    data: value.items.map(toContractRentalListItem),
    pagination: toContractPage(value),
  };

  return c.json<RentalsContracts.RentalListResponse, 200>(response, 200);
};

const endRentalByAdmin: RouteHandler<RentalsRoutes["endRentalByAdmin"]> = async (c) => {
  const { rentalId } = c.req.valid("param");
  const body = c.req.valid("json");

  const eff = withLoggedCause(
    endRentalByAdminUseCase({
      rentalId,
      endStationId: body.endStation,
      endTime: body.endTime ? new Date(body.endTime) : new Date(),
    }),
    "PUT /v1/rentals/{rentalId}/end",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) => {
      if (right.bikeId) {
        void notifyBikeStatusUpdate({
          userId: right.userId,
          bikeId: right.bikeId,
          status: "AVAILABLE",
          rentalId: right.id,
          at: new Date().toISOString(),
        });
      }

      const detailEff = withLoggedCause(
        adminGetRentalDetailUseCase(rentalId),
        "GET /v1/admin/rentals/{rentalId}",
      );

      return c.var.runPromise(detailEff).then(detail =>
        c.json(
          {
            message: "Rental ended successfully",
            result: toContractAdminRentalDetail(detail),
          },
          200,
        ));
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
  endRentalByAdmin,
  getActiveRentalsByPhone,
} as const;
