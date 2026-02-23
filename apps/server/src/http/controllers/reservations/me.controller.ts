import type { RouteHandler } from "@hono/zod-openapi";

import { Effect, Match, Option } from "effect";

import {
  cancelReservationUseCase,
  confirmReservationUseCase,
  ReservationServiceTag,
  reserveBikeUseCase,
} from "@/domain/reservations";
import { withLoggedCause } from "@/domain/shared";
import { toContractReservation } from "@/http/presenters/reservations.presenter";

import type { ListMyReservationsResponse, ReservationDetailResponse, ReservationErrorResponse, ReservationsRoutes } from "./shared";

import {
  ReservationErrorCodeSchema,
  reservationErrorMessages,
} from "./shared";

const reserveBike: RouteHandler<ReservationsRoutes["reserveBike"]> = async (c) => {
  const userId = c.var.currentUser!.userId;
  const body = c.req.valid("json");
  const now = new Date();
  const startTime = body.startTime ? new Date(body.startTime) : now;

  const eff = withLoggedCause(
    reserveBikeUseCase({
      userId,
      bikeId: body.bikeId,
      stationId: body.stationId,
      reservationOption: body.reservationOption,
      subscriptionId: body.subscriptionId ?? null,
      startTime,
      endTime: null,
      now,
    }),
    "POST /v1/reservations",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<ReservationDetailResponse, 200>(toContractReservation(right), 200)),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("ActiveReservationExists", ({ userId: ownerId }) =>
          c.json<ReservationErrorResponse, 400>({
            error: reservationErrorMessages.ACTIVE_RESERVATION_EXISTS,
            details: {
              code: ReservationErrorCodeSchema.enum.ACTIVE_RESERVATION_EXISTS,
              userId: ownerId,
            },
          }, 400)),
        Match.tag("BikeAlreadyReserved", ({ bikeId }) =>
          c.json<ReservationErrorResponse, 400>({
            error: reservationErrorMessages.BIKE_ALREADY_RESERVED,
            details: {
              code: ReservationErrorCodeSchema.enum.BIKE_ALREADY_RESERVED,
              bikeId,
            },
          }, 400)),
        Match.tag("BikeNotFound", ({ bikeId }) =>
          c.json<ReservationErrorResponse, 400>({
            error: reservationErrorMessages.BIKE_NOT_FOUND,
            details: {
              code: ReservationErrorCodeSchema.enum.BIKE_NOT_FOUND,
              bikeId,
            },
          }, 400)),
        Match.tag("BikeNotFoundInStation", ({ bikeId, stationId }) =>
          c.json<ReservationErrorResponse, 400>({
            error: reservationErrorMessages.BIKE_NOT_FOUND_IN_STATION,
            details: {
              code: ReservationErrorCodeSchema.enum.BIKE_NOT_FOUND_IN_STATION,
              bikeId,
              stationId,
            },
          }, 400)),
        Match.tag("BikeNotAvailable", ({ bikeId, status }) =>
          c.json<ReservationErrorResponse, 400>({
            error: reservationErrorMessages.BIKE_NOT_AVAILABLE,
            details: {
              code: ReservationErrorCodeSchema.enum.BIKE_NOT_AVAILABLE,
              bikeId,
              status,
            },
          }, 400)),
        Match.tag("ReservationOptionNotSupported", ({ option }) =>
          c.json<ReservationErrorResponse, 400>({
            error: reservationErrorMessages.RESERVATION_OPTION_NOT_SUPPORTED,
            details: {
              code: ReservationErrorCodeSchema.enum.RESERVATION_OPTION_NOT_SUPPORTED,
              option,
            },
          }, 400)),
        Match.tag("SubscriptionRequired", ({ userId: missingUserId }) =>
          c.json<ReservationErrorResponse, 400>({
            error: reservationErrorMessages.SUBSCRIPTION_REQUIRED,
            details: {
              code: ReservationErrorCodeSchema.enum.SUBSCRIPTION_REQUIRED,
              userId: missingUserId,
            },
          }, 400)),
        Match.tag("SubscriptionNotFound", ({ subscriptionId }) =>
          c.json<ReservationErrorResponse, 400>({
            error: reservationErrorMessages.SUBSCRIPTION_NOT_FOUND,
            details: {
              code: ReservationErrorCodeSchema.enum.SUBSCRIPTION_NOT_FOUND,
              subscriptionId,
            },
          }, 400)),
        Match.tag("SubscriptionNotUsable", ({ subscriptionId, status }) =>
          c.json<ReservationErrorResponse, 400>({
            error: reservationErrorMessages.SUBSCRIPTION_NOT_USABLE,
            details: {
              code: ReservationErrorCodeSchema.enum.SUBSCRIPTION_NOT_USABLE,
              subscriptionId,
              status,
            },
          }, 400)),
        Match.tag("SubscriptionUsageExceeded", ({ subscriptionId, usageCount, maxUsages }) =>
          c.json<ReservationErrorResponse, 400>({
            error: reservationErrorMessages.SUBSCRIPTION_USAGE_EXCEEDED,
            details: {
              code: ReservationErrorCodeSchema.enum.SUBSCRIPTION_USAGE_EXCEEDED,
              subscriptionId,
              usageCount,
              maxUsages,
            },
          }, 400)),
        Match.tag("WalletNotFound", ({ userId: missingUserId }) =>
          c.json<ReservationErrorResponse, 400>({
            error: reservationErrorMessages.WALLET_NOT_FOUND,
            details: {
              code: ReservationErrorCodeSchema.enum.WALLET_NOT_FOUND,
              userId: missingUserId,
            },
          }, 400)),
        Match.tag("InsufficientWalletBalance", ({ userId: walletUserId, balance, attemptedDebit }) =>
          c.json<ReservationErrorResponse, 400>({
            error: reservationErrorMessages.INSUFFICIENT_WALLET_BALANCE,
            details: {
              code: ReservationErrorCodeSchema.enum.INSUFFICIENT_WALLET_BALANCE,
              userId: walletUserId,
              balance: Number(balance),
              attemptedDebit: Number(attemptedDebit),
            },
          }, 400)),
        Match.orElse(() => {
          throw left;
        }),
      )),
    Match.exhaustive,
  );
};

const confirmReservation: RouteHandler<ReservationsRoutes["confirmReservation"]> = async (c) => {
  const userId = c.var.currentUser!.userId;
  const { reservationId } = c.req.valid("param");
  const now = new Date();

  const eff = withLoggedCause(
    confirmReservationUseCase({
      reservationId,
      userId,
      now,
    }),
    "POST /v1/reservations/{reservationId}/confirm",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<ReservationDetailResponse, 200>(toContractReservation(right), 200)),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("ReservationNotFound", ({ reservationId: missingId }) =>
          c.json<ReservationErrorResponse, 400>({
            error: reservationErrorMessages.RESERVATION_NOT_FOUND,
            details: {
              code: ReservationErrorCodeSchema.enum.RESERVATION_NOT_FOUND,
              reservationId: missingId,
            },
          }, 400)),
        Match.tag("ReservationNotOwned", ({ reservationId: missingId }) =>
          c.json<ReservationErrorResponse, 400>({
            error: reservationErrorMessages.RESERVATION_NOT_OWNED,
            details: {
              code: ReservationErrorCodeSchema.enum.RESERVATION_NOT_OWNED,
              reservationId: missingId,
              userId,
            },
          }, 400)),
        Match.tag("ReservationMissingBike", ({ reservationId: missingId }) =>
          c.json<ReservationErrorResponse, 400>({
            error: reservationErrorMessages.RESERVATION_MISSING_BIKE,
            details: {
              code: ReservationErrorCodeSchema.enum.RESERVATION_MISSING_BIKE,
              reservationId: missingId,
            },
          }, 400)),
        Match.tag("InvalidReservationTransition", ({ reservationId: missingId, from, to }) =>
          c.json<ReservationErrorResponse, 400>({
            error: reservationErrorMessages.INVALID_RESERVATION_TRANSITION,
            details: {
              code: ReservationErrorCodeSchema.enum.INVALID_RESERVATION_TRANSITION,
              reservationId: missingId,
              from,
              to,
            },
          }, 400)),
        Match.tag("ReservedRentalNotFound", ({ reservationId: missingId }) =>
          c.json<ReservationErrorResponse, 400>({
            error: reservationErrorMessages.RESERVED_RENTAL_NOT_FOUND,
            details: {
              code: ReservationErrorCodeSchema.enum.RESERVED_RENTAL_NOT_FOUND,
              reservationId: missingId,
            },
          }, 400)),
        Match.tag("BikeNotFound", ({ bikeId }) =>
          c.json<ReservationErrorResponse, 400>({
            error: reservationErrorMessages.BIKE_NOT_FOUND,
            details: {
              code: ReservationErrorCodeSchema.enum.BIKE_NOT_FOUND,
              bikeId,
            },
          }, 400)),
        Match.tag("BikeNotAvailable", ({ bikeId, status }) =>
          c.json<ReservationErrorResponse, 400>({
            error: reservationErrorMessages.BIKE_NOT_AVAILABLE,
            details: {
              code: ReservationErrorCodeSchema.enum.BIKE_NOT_AVAILABLE,
              bikeId,
              status,
            },
          }, 400)),
        Match.orElse(() => {
          throw left;
        }),
      )),
    Match.exhaustive,
  );
};

const cancelReservation: RouteHandler<ReservationsRoutes["cancelReservation"]> = async (c) => {
  const userId = c.var.currentUser!.userId;
  const { reservationId } = c.req.valid("param");
  const now = new Date();

  const eff = withLoggedCause(
    cancelReservationUseCase({
      reservationId,
      userId,
      now,
    }),
    "POST /v1/reservations/{reservationId}/cancel",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<ReservationDetailResponse, 200>(toContractReservation(right), 200)),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("ReservationNotFound", ({ reservationId: missingId }) =>
          c.json<ReservationErrorResponse, 400>({
            error: reservationErrorMessages.RESERVATION_NOT_FOUND,
            details: {
              code: ReservationErrorCodeSchema.enum.RESERVATION_NOT_FOUND,
              reservationId: missingId,
            },
          }, 400)),
        Match.tag("ReservationNotOwned", ({ reservationId: missingId }) =>
          c.json<ReservationErrorResponse, 400>({
            error: reservationErrorMessages.RESERVATION_NOT_OWNED,
            details: {
              code: ReservationErrorCodeSchema.enum.RESERVATION_NOT_OWNED,
              reservationId: missingId,
              userId,
            },
          }, 400)),
        Match.tag("InvalidReservationTransition", ({ reservationId: missingId, from, to }) =>
          c.json<ReservationErrorResponse, 400>({
            error: reservationErrorMessages.INVALID_RESERVATION_TRANSITION,
            details: {
              code: ReservationErrorCodeSchema.enum.INVALID_RESERVATION_TRANSITION,
              reservationId: missingId,
              from,
              to,
            },
          }, 400)),
        Match.tag("BikeNotFound", ({ bikeId }) =>
          c.json<ReservationErrorResponse, 400>({
            error: reservationErrorMessages.BIKE_NOT_FOUND,
            details: {
              code: ReservationErrorCodeSchema.enum.BIKE_NOT_FOUND,
              bikeId,
            },
          }, 400)),
        Match.tag("BikeNotAvailable", ({ bikeId, status }) =>
          c.json<ReservationErrorResponse, 400>({
            error: reservationErrorMessages.BIKE_NOT_AVAILABLE,
            details: {
              code: ReservationErrorCodeSchema.enum.BIKE_NOT_AVAILABLE,
              bikeId,
              status,
            },
          }, 400)),
        Match.orElse(() => {
          throw left;
        }),
      )),
    Match.exhaustive,
  );
};

const listMyReservations: RouteHandler<ReservationsRoutes["listMyReservations"]> = async (c) => {
  const userId = c.var.currentUser!.userId;
  const query = c.req.valid("query");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* ReservationServiceTag;
      return yield* service.listForUser(userId, {
        status: query.status,
        stationId: query.stationId,
        reservationOption: query.reservationOption,
      }, {
        page: Number(query.page ?? 1),
        pageSize: Number(query.pageSize ?? 50),
        sortBy: "startTime",
        sortDir: "desc",
      });
    }),
    "GET /v1/reservations/me",
  );

  const value = await c.var.runPromise(eff);

  return c.json<ListMyReservationsResponse, 200>({
    data: value.items.map(toContractReservation),
    pagination: {
      page: value.page,
      pageSize: value.pageSize,
      total: value.total,
      totalPages: value.totalPages,
    },
  }, 200);
};

const getMyReservation: RouteHandler<ReservationsRoutes["getMyReservation"]> = async (c) => {
  const userId = c.var.currentUser!.userId;
  const { reservationId } = c.req.valid("param");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* ReservationServiceTag;
      return yield* service.getById(reservationId);
    }),
    "GET /v1/reservations/me/{reservationId}",
  );

  const reservationOpt = await c.var.runPromise(eff);

  if (Option.isNone(reservationOpt)) {
    return c.json<ReservationErrorResponse, 400>({
      error: reservationErrorMessages.RESERVATION_NOT_FOUND,
      details: {
        code: ReservationErrorCodeSchema.enum.RESERVATION_NOT_FOUND,
        reservationId,
      },
    }, 400);
  }

  if (reservationOpt.value.userId !== userId) {
    return c.json<ReservationErrorResponse, 400>({
      error: reservationErrorMessages.RESERVATION_NOT_OWNED,
      details: {
        code: ReservationErrorCodeSchema.enum.RESERVATION_NOT_OWNED,
        reservationId,
        userId,
      },
    }, 400);
  }

  return c.json<ReservationDetailResponse, 200>(toContractReservation(reservationOpt.value), 200);
};

export const ReservationMeController = {
  reserveBike,
  confirmReservation,
  cancelReservation,
  listMyReservations,
  getMyReservation,
} as const;
