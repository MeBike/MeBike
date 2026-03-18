import { createRoute } from "@hono/zod-openapi";

import {
  ListAdminReservationsQuerySchema,
  ListAdminReservationsResponseSchema,
  ListMyReservationsQuerySchema,
  ListMyReservationsResponseSchema,
  ReservationDetailResponseSchema,
  ReservationErrorCodeSchema,
  ReservationErrorResponseSchema,
} from "../../reservations";
import {
  forbiddenResponse,
  notFoundResponse,
  paginatedResponse,
  unauthorizedResponse,
} from "../helpers";
import { ReservationIdParamSchema } from "./shared";

export const listMyReservationsRoute = createRoute({
  method: "get",
  path: "/v1/reservations/me",
  tags: ["Reservations"],
  security: [{ bearerAuth: [] }],
  request: {
    query: ListMyReservationsQuerySchema,
  },
  responses: {
    200: paginatedResponse(ListMyReservationsResponseSchema, "List current user's reservations"),
    401: unauthorizedResponse(),
  },
});

export const getMyReservationRoute = createRoute({
  method: "get",
  path: "/v1/reservations/me/{reservationId}",
  tags: ["Reservations"],
  security: [{ bearerAuth: [] }],
  request: {
    params: ReservationIdParamSchema,
  },
  responses: {
    200: {
      description: "Get reservation detail for current user",
      content: {
        "application/json": {
          schema: ReservationDetailResponseSchema,
        },
      },
    },
    400: {
      description: "Reservation access error",
      content: {
        "application/json": {
          schema: ReservationErrorResponseSchema,
          examples: {
            NotFound: {
              value: {
                error: "Reservation not found",
                details: { code: ReservationErrorCodeSchema.enum.RESERVATION_NOT_FOUND },
              },
            },
            NotOwned: {
              value: {
                error: "Reservation does not belong to user",
                details: { code: ReservationErrorCodeSchema.enum.RESERVATION_NOT_OWNED },
              },
            },
          },
        },
      },
    },
    401: unauthorizedResponse(),
  },
});

export const adminListReservationsRoute = createRoute({
  method: "get",
  path: "/v1/admin/reservations",
  tags: ["Admin", "Reservations"],
  security: [{ bearerAuth: [] }],
  request: {
    query: ListAdminReservationsQuerySchema,
  },
  responses: {
    200: paginatedResponse(ListAdminReservationsResponseSchema, "List reservations for admin"),
    401: unauthorizedResponse(),
    403: forbiddenResponse("Admin"),
  },
});

export const adminGetReservationRoute = createRoute({
  method: "get",
  path: "/v1/admin/reservations/{reservationId}",
  tags: ["Admin", "Reservations"],
  security: [{ bearerAuth: [] }],
  request: {
    params: ReservationIdParamSchema,
  },
  responses: {
    200: {
      description: "Get reservation detail for admin",
      content: {
        "application/json": {
          schema: ReservationDetailResponseSchema,
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Admin"),
    404: notFoundResponse({
      description: "Reservation not found",
      schema: ReservationErrorResponseSchema,
      example: {
        error: "Reservation not found",
        details: { code: ReservationErrorCodeSchema.enum.RESERVATION_NOT_FOUND },
      },
    }),
  },
});
