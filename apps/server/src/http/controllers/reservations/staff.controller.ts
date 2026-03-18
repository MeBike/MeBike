import type { RouteHandler } from "@hono/zod-openapi";

import { Effect, Match, Option } from "effect";

import type { ReservationExpandedDetailRow } from "@/domain/reservations";

import { ReservationRepository } from "@/domain/reservations";
import { withLoggedCause } from "@/domain/shared";
import {
  toContractReservation,
  toContractReservationExpanded,
} from "@/http/presenters/reservations.presenter";
import { toContractPage } from "@/http/shared/pagination";

import type {
  ListStaffReservationsResponse,
  ReservationErrorResponse,
  ReservationExpandedDetailResponse,
  ReservationsRoutes,
} from "./shared";

import {
  ReservationErrorCodeSchema,
  reservationErrorMessages,
} from "./shared";

const staffListReservations: RouteHandler<
  ReservationsRoutes["staffListReservations"]
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
    "GET /v1/staff/reservations",
  );

  const value = await c.var.runPromise(eff);
  return c.json<ListStaffReservationsResponse, 200>(
    {
      data: value.items.map(toContractReservation),
      pagination: toContractPage(value),
    },
    200,
  );
};

const staffGetReservation: RouteHandler<
  ReservationsRoutes["staffGetReservation"]
> = async (c) => {
  const { reservationId } = c.req.valid("param");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const repo = yield* ReservationRepository;
      return yield* repo.findExpandedDetailById(reservationId);
    }),
    "GET /v1/staff/reservations/{reservationId}",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) => {
      if (Option.isSome(right)) {
        const detail = right.value as ReservationExpandedDetailRow;
        return c.json<ReservationExpandedDetailResponse, 200>(
          toContractReservationExpanded(detail),
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
    Match.orElse(() => {
      throw new Error("Unexpected reservation staff detail result state");
    }),
  );
};

export const ReservationStaffController = {
  staffListReservations,
  staffGetReservation,
} as const;
