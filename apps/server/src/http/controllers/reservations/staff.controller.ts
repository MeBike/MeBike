import type { RouteHandler } from "@hono/zod-openapi";

import { Effect, Match, Option } from "effect";

import { ReservationQueryServiceTag } from "@/domain/reservations";
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

function getStationScopedRoleScope(currentUser: {
  role: string;
  operatorStationId?: string;
}) {
  if (currentUser.role === "STAFF" || currentUser.role === "MANAGER") {
    return currentUser.operatorStationId ?? null;
  }

  return undefined;
}

const staffListReservations: RouteHandler<
  ReservationsRoutes["staffListReservations"]
> = async (c) => {
  const query = c.req.valid("query");
  const stationScopeId = getStationScopedRoleScope(c.var.currentUser!);

  if (stationScopeId === null) {
    return c.json<ListStaffReservationsResponse, 200>(
      {
        data: [],
        pagination: {
          page: query.page ?? 1,
          pageSize: query.pageSize ?? 50,
          total: 0,
          totalPages: 0,
        },
      },
      200,
    );
  }

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* ReservationQueryServiceTag;
      return yield* service.listForAdmin(
        {
          userId: query.userId,
          bikeId: query.bikeId,
          status: query.status,
          stationId: stationScopeId ?? query.stationId,
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
  const stationScopeId = getStationScopedRoleScope(c.var.currentUser!);

  if (stationScopeId === null) {
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

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* ReservationQueryServiceTag;
      return yield* service.getExpandedDetailById(reservationId);
    }),
    "GET /v1/staff/reservations/{reservationId}",
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

      if (stationScopeId && right.value.station.id !== stationScopeId) {
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
      throw new Error("Unexpected reservation staff detail result state");
    }),
  );
};

export const ReservationStaffController = {
  staffListReservations,
  staffGetReservation,
} as const;
