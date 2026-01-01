import { createRoute } from "@hono/zod-openapi";

import {
  CreateReservationRequestSchema,
  ReservationErrorCodeSchema,
  ReservationErrorResponseSchema,
  ReservationDetailResponseSchema,
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
  UnauthorizedErrorResponseSchema,
} from "../../reservations";
import { ReservationIdParamSchema } from "./shared";

export const reserveBikeRoute = createRoute({
  method: "post",
  path: "/v1/reservations",
  tags: ["Reservations"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateReservationRequestSchema.openapi("CreateReservationRequest"),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Reservation created successfully",
      content: {
        "application/json": {
          schema: ReservationDetailResponseSchema,
        },
      },
    },
    400: {
      description: "Cannot create reservation",
      content: {
        "application/json": {
          schema: ReservationErrorResponseSchema,
          examples: {
            ActiveReservationExists: {
              value: {
                error: "User already has an active reservation",
                details: { code: ReservationErrorCodeSchema.enum.ACTIVE_RESERVATION_EXISTS },
              },
            },
            BikeAlreadyReserved: {
              value: {
                error: "Bike is already reserved",
                details: { code: ReservationErrorCodeSchema.enum.BIKE_ALREADY_RESERVED },
              },
            },
            InsufficientBalance: {
              value: {
                error: "Insufficient wallet balance",
                details: { code: ReservationErrorCodeSchema.enum.INSUFFICIENT_WALLET_BALANCE },
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

export const confirmReservationRoute = createRoute({
  method: "post",
  path: "/v1/reservations/{reservationId}/confirm",
  tags: ["Reservations"],
  security: [{ bearerAuth: [] }],
  request: {
    params: ReservationIdParamSchema,
  },
  responses: {
    200: {
      description: "Reservation confirmed successfully",
      content: {
        "application/json": {
          schema: ReservationDetailResponseSchema,
        },
      },
    },
    400: {
      description: "Cannot confirm reservation",
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
            InvalidTransition: {
              value: {
                error: "Invalid reservation status transition",
                details: { code: ReservationErrorCodeSchema.enum.INVALID_RESERVATION_TRANSITION },
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

export const cancelReservationRoute = createRoute({
  method: "post",
  path: "/v1/reservations/{reservationId}/cancel",
  tags: ["Reservations"],
  security: [{ bearerAuth: [] }],
  request: {
    params: ReservationIdParamSchema,
  },
  responses: {
    200: {
      description: "Reservation cancelled successfully",
      content: {
        "application/json": {
          schema: ReservationDetailResponseSchema,
        },
      },
    },
    400: {
      description: "Cannot cancel reservation",
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
            InvalidTransition: {
              value: {
                error: "Invalid reservation status transition",
                details: { code: ReservationErrorCodeSchema.enum.INVALID_RESERVATION_TRANSITION },
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
