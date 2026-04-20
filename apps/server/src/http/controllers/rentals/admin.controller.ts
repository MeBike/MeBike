import type { RouteHandler } from "@hono/zod-openapi";
import type { RentalsContracts } from "@mebike/shared";

import { Effect, Match } from "effect";

import {
  adminGetChangeBikeDetail,
  adminGetRentalDetail,
  RentalCommandServiceTag,
  RentalRepository,
  RentalStatsServiceTag,
} from "@/domain/rentals";
import { previousUtcMonthFullRange } from "@/domain/rentals/services/queries/rental-stats-time";
import { withLoggedCause } from "@/domain/shared";
import {
  toContractAdminRentalDetail,
  toContractAdminRentalListItem,
  toContractBikeSwapRequestDetail,
  toContractRentalListItem,
} from "@/http/presenters/rentals.presenter";
import { toContractPage } from "@/http/shared/pagination";
import { notifyBikeStatusUpdate } from "@/realtime/bike-status-events";

import type { RentalsRoutes } from "./shared";

import {
  BikeSwapRequestErrorCodeSchema,
  bikeSwapRequestErrorMessages,
  RentalErrorCodeSchema,
  rentalErrorMessages,
} from "./shared";

const getRentalRevenue: RouteHandler<
  RentalsRoutes["getRentalRevenue"]
> = async (c) => {
  const query = c.req.valid("query");

  const groupBy = query.groupBy ?? "DAY";
  const from = query.from ? new Date(query.from) : null;
  const to = query.to ? new Date(query.to) : null;

  if ((from && !to) || (!from && to)) {
    return c.json<RentalsContracts.RentalErrorResponse, 400>(
      {
        error: "from and to must be provided together",
        details: {
          code: RentalErrorCodeSchema.enum.INVALID_OBJECT_ID,
          from: query.from,
          to: query.to,
        },
      },
      400,
    );
  }

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const stats = yield* RentalStatsServiceTag;

      const range
        = from && to ? { from, to } : previousUtcMonthFullRange(new Date());

      return yield* stats.getRevenueSeries({
        from: range.from,
        to: range.to,
        groupBy,
      });
    }),
    "GET /v1/rentals/stats/revenue",
  );

  const result = await c.var.runPromise(eff);
  return c.json<RentalsContracts.RentalRevenueResponse, 200>(
    {
      period: {
        from: result.period.from.toISOString(),
        to: result.period.to.toISOString(),
      },
      groupBy: result.groupBy,
      data: result.data.map(item => ({
        date: item.date.toISOString(),
        totalRevenue: item.totalRevenue,
        totalRentals: item.totalRentals,
      })),
    },
    200,
  );
};

const getRentalStatsSummary: RouteHandler<
  RentalsRoutes["getRentalStatsSummary"]
> = async (c) => {
  const eff = withLoggedCause(
    Effect.flatMap(RentalStatsServiceTag, svc => svc.getSummary()),
    "GET /v1/rentals/stats/summary",
  );

  const result = await c.var.runPromise(eff);
  return c.json(result, 200);
};

const getDashboardSummary: RouteHandler<
  RentalsRoutes["getDashboardSummary"]
> = async (c) => {
  const eff = withLoggedCause(
    Effect.flatMap(RentalStatsServiceTag, svc => svc.getDashboardSummary()),
    "GET /v1/rentals/dashboard-summary",
  );

  const result = await c.var.runPromise(eff);
  return c.json<RentalsContracts.DashboardResponse, 200>(result, 200);
};

const adminListRentals: RouteHandler<
  RentalsRoutes["adminListRentals"]
> = async (c) => {
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

const adminGetRental: RouteHandler<RentalsRoutes["adminGetRental"]> = async (
  c,
) => {
  const { rentalId } = c.req.valid("param");

  const eff = withLoggedCause(
    adminGetRentalDetail(rentalId),
    "GET /v1/admin/rentals/{rentalId}",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) => {
      const detail = toContractAdminRentalDetail(right);
      return c.json(detail, 200);
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

const getActiveRentalsByPhone: RouteHandler<
  RentalsRoutes["getActiveRentalsByPhone"]
> = async (c) => {
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

const confirmRentalReturnByOperatorHandler: RouteHandler<
  RentalsRoutes["confirmRentalReturnByOperator"]
> = async (c) => {
  const { rentalId } = c.req.valid("param");
  const body = c.req.valid("json");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* RentalCommandServiceTag;
      return yield* service.confirmReturnByOperator({
        rentalId,
        stationId: body.stationId,
        confirmedByUserId: c.var.currentUser!.userId,
        operatorRole: c.var.currentUser!.role as "STAFF" | "AGENCY",
        operatorStationId: c.var.currentUser!.operatorStationId ?? null,
        operatorAgencyId: c.var.currentUser!.agencyId ?? null,
        confirmationMethod: body.confirmationMethod ?? "MANUAL",
        confirmedAt: body.confirmedAt ? new Date(body.confirmedAt) : new Date(),
      });
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
        adminGetRentalDetail(rentalId),
        "GET /v1/admin/rentals/{rentalId}",
      );

      return c.var
        .runPromise(detailEff)
        .then(detail => c.json(toContractAdminRentalDetail(detail), 200));
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
        Match.tag("UnauthorizedRentalAccess", ({ userId }) =>
          c.json<RentalsContracts.RentalErrorResponse, 403>(
            {
              error: rentalErrorMessages.ACCESS_DENIED,
              details: {
                code: RentalErrorCodeSchema.enum.ACCESS_DENIED,
                rentalId,
                stationId: body.stationId,
                userId,
              },
            },
            403,
          )),
        Match.tag("ReturnSlotRequiredForReturn", () =>
          c.json(
            {
              error: rentalErrorMessages.RETURN_SLOT_REQUIRED_FOR_RETURN,
              details: {
                code: RentalErrorCodeSchema.enum.RETURN_SLOT_REQUIRED_FOR_RETURN,
                rentalId,
                endStationId: body.stationId,
              },
            },
            400,
          )),
        Match.tag(
          "ReturnSlotCapacityExceeded",
          ({ stationId, totalCapacity, returnSlotLimit, totalBikes, activeReturnSlots }) =>
            c.json(
              {
                error: rentalErrorMessages.RETURN_SLOT_CAPACITY_EXCEEDED,
                details: {
                  code: RentalErrorCodeSchema.enum.RETURN_SLOT_CAPACITY_EXCEEDED,
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
        Match.tag("ReturnSlotStationMismatch", ({ returnSlotStationId, attemptedEndStationId }) =>
          c.json(
            {
              error: rentalErrorMessages.RETURN_SLOT_STATION_MISMATCH,
              details: {
                code: RentalErrorCodeSchema.enum.RETURN_SLOT_STATION_MISMATCH,
                rentalId,
                returnSlotStationId,
                endStationId: attemptedEndStationId,
              },
            },
            400,
          )),
        Match.tag("StationNotFound", ({ id }) =>
          c.json(
            {
              error: rentalErrorMessages.STATION_NOT_FOUND,
              details: {
                code: RentalErrorCodeSchema.enum.STATION_NOT_FOUND,
                stationId: id,
              },
            },
            400,
          )),
        Match.tag("ReturnAlreadyConfirmed", () =>
          c.json(
            {
              error: rentalErrorMessages.RETURN_ALREADY_CONFIRMED,
              details: {
                code: RentalErrorCodeSchema.enum.RETURN_ALREADY_CONFIRMED,
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
        Match.orElse(() => {
          throw left;
        }),
      )),
    Match.exhaustive,
  );
};

const adminGetBikeSwapRequests: RouteHandler<
  RentalsRoutes["adminGetBikeSwapRequests"]
> = async (c) => {
  const { bikeSwapRequestId } = c.req.valid("param");

  const eff = withLoggedCause(
    adminGetChangeBikeDetail(bikeSwapRequestId),
    "GET /v1/admin/bike-swap-requests/{bikeSwapRequestId}",
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
        Match.tag("AdminBikeRequestNotFound", () =>
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

const adminListBikeSwapRequests: RouteHandler<
  RentalsRoutes["adminListBikeSwapRequests"]
> = async (c) => {
  const query = c.req.valid("query");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const repo = yield* RentalRepository;
      return yield* repo.adminListBikeSwapRequests(
        {
          userId: query.userId,
          status: query.status,
          stationId: query.stationId,
        },
        {
          page: Number(query.page ?? 1),
          pageSize: Number(query.pageSize ?? 50),
          sortBy: query.sortBy ?? "createdAt",
          sortDir: query.sortDir ?? "desc",
        },
      );
    }),
    "GET /v1/admin/bike-swap-requests",
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

export const RentalAdminController = {
  adminListRentals,
  adminGetRental,
  adminGetBikeSwapRequests,
  confirmRentalReturnByOperator: confirmRentalReturnByOperatorHandler,
  getActiveRentalsByPhone,
  getDashboardSummary,
  getRentalRevenue,
  getRentalStatsSummary,
  adminListBikeSwapRequests,
} as const;
