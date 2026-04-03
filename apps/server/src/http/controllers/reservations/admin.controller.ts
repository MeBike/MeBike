import type { RouteHandler } from "@hono/zod-openapi";

import { Effect, Match, Option } from "effect";

import {
  ReservationQueryServiceTag,
  ReservationStatsServiceTag,
} from "@/domain/reservations";
import { withLoggedCause } from "@/domain/shared";
import {
  toContractReservation,
  toContractReservationExpanded,
} from "@/http/presenters/reservations.presenter";
import { toContractPage } from "@/http/shared/pagination";

import type {
  ListAdminReservationsResponse,
  ReservationErrorResponse,
  ReservationExpandedDetailResponse,
  ReservationSummaryStatsResponse,
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
      const service = yield* ReservationQueryServiceTag;
      return yield* service.listForAdmin(
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
      const service = yield* ReservationQueryServiceTag;
      return yield* service.getExpandedDetailById(reservationId);
    }),
    "GET /v1/admin/reservations/{reservationId}",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) => {
      if (Option.isNone(right)) {
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
      }

      return c.json<ReservationExpandedDetailResponse, 200>(
        toContractReservationExpanded(right.value),
        200,
      );
    }),
    Match.tag("Left", ({ left }) => {
      throw left;
    }),
    Match.orElse(() => {
      throw new Error("Unexpected reservation admin detail result state");
    }),
  );
};

const getReservationStatsSummary: RouteHandler<
  ReservationsRoutes["getReservationStatsSummary"]
> = async (c) => {
  const eff = withLoggedCause(
    Effect.flatMap(ReservationStatsServiceTag, svc => svc.getSummary()),
    "GET /v1/reservations/stats/summary",
  );

  const result = await c.var.runPromise(eff);
  return c.json<ReservationSummaryStatsResponse, 200>(result, 200);
};

export const ReservationAdminController = {
  adminListReservations,
  adminGetReservation,
  getReservationStatsSummary,
} as const;
