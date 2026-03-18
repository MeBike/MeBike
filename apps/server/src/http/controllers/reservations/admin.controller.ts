import type { RouteHandler } from "@hono/zod-openapi";

import { Effect, Match, Option } from "effect";

import { ReservationRepository } from "@/domain/reservations";
import { withLoggedCause } from "@/domain/shared";
import { toContractReservation } from "@/http/presenters/reservations.presenter";
import { toContractPage } from "@/http/shared/pagination";

import type {
  ListAdminReservationsResponse,
  ReservationDetailResponse,
  ReservationErrorResponse,
  ReservationsRoutes,
} from "./shared";

import {
  ReservationErrorCodeSchema,
  reservationErrorMessages,
} from "./shared";

const adminListReservations: RouteHandler<
  ReservationsRoutes["adminListReservations"]
> = async (c) => {
  const query = c.req.valid("query");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const repo = yield* ReservationRepository;
      return yield* repo.listForAdmin(
        {
          userId: query.userId,
          bikeId: query.bikeId,
          status: query.status,
          stationId: query.stationId,
          reservationOption: query.reservationOption,
        },
        {
          page: query.page ?? 1,
          pageSize: query.pageSize ?? 50,
          sortBy: query.sortBy ?? "startTime",
          sortDir: query.sortDir ?? "desc",
        },
      );
    }),
    "GET /v1/admin/reservations",
  );

  const value = await c.var.runPromise(eff);
  return c.json<ListAdminReservationsResponse, 200>(
    {
      data: value.items.map(toContractReservation),
      pagination: toContractPage(value),
    },
    200,
  );
};

const adminGetReservation: RouteHandler<
  ReservationsRoutes["adminGetReservation"]
> = async (c) => {
  const { reservationId } = c.req.valid("param");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const repo = yield* ReservationRepository;
      return yield* repo.findById(reservationId);
    }),
    "GET /v1/admin/reservations/{reservationId}",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) => {
      if (Option.isSome(right)) {
        return c.json<ReservationDetailResponse, 200>(
          toContractReservation(right.value),
          200,
        );
      }

      return c.json<ReservationErrorResponse, 404>(
        {
          error: reservationErrorMessages.RESERVATION_NOT_FOUND,
          details: {
            code: ReservationErrorCodeSchema.enum.RESERVATION_NOT_FOUND,
            reservationId,
          },
        },
        404,
      );
    }),
    Match.tag("Left", ({ left }) => {
      throw left;
    }),
    Match.exhaustive,
  );
};

export const ReservationAdminController = {
  adminListReservations,
  adminGetReservation,
} as const;
