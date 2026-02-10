import { createRoute } from "@hono/zod-openapi";

import {
  ListMyReservationsQuerySchema,
  ListMyReservationsResponseSchema,
  ReservationDetailResponseSchema,
  ReservationErrorCodeSchema,
  ReservationErrorResponseSchema,
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
  UnauthorizedErrorResponseSchema,
} from "../../reservations";
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
    200: {
      description: "List current user's reservations",
      content: {
        "application/json": {
          schema: ListMyReservationsResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: UnauthorizedErrorResponseSchema,
          examples: {
            Unauthorized: {
              value: {
                error: unauthorizedErrorMessages.UNAUTHORIZED,
                details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
              },
            },
          },
        },
      },
    },
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
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: UnauthorizedErrorResponseSchema,
          examples: {
            Unauthorized: {
              value: {
                error: unauthorizedErrorMessages.UNAUTHORIZED,
                details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
              },
            },
          },
        },
      },
    },
  },
});
