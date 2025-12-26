import { createRoute, z } from "@hono/zod-openapi";

import {
  CreateRatingRequestSchema,
  CreateRatingResponseSchema,
  RatingErrorCodeSchema,
  ratingErrorMessages,
} from "../../ratings/schemas";
import {
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
  UnauthorizedErrorResponseSchema,
} from "../../schemas";

export const createRatingRoute = createRoute({
  method: "post",
  path: "/v1/ratings/{rentalId}",
  tags: ["Ratings"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      rentalId: z.uuidv7(),
    }),
    body: {
      content: {
        "application/json": {
          schema: CreateRatingRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Rating created",
      content: {
        "application/json": {
          schema: CreateRatingResponseSchema,
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
    400: {
      description: "Rental not completed or rating window expired",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
            details: z.object({
              code: RatingErrorCodeSchema,
            }),
          }),
          examples: {
            NotCompleted: {
              value: {
                error: ratingErrorMessages.RENTAL_NOT_COMPLETED,
                details: { code: RatingErrorCodeSchema.enum.RENTAL_NOT_COMPLETED },
              },
            },
            Expired: {
              value: {
                error: ratingErrorMessages.RATING_EXPIRED,
                details: { code: RatingErrorCodeSchema.enum.RATING_EXPIRED },
              },
            },
            ReasonNotFound: {
              value: {
                error: ratingErrorMessages.RATING_REASON_NOT_FOUND,
                details: { code: RatingErrorCodeSchema.enum.RATING_REASON_NOT_FOUND },
              },
            },
          },
        },
      },
    },
    403: {
      description: "Unauthorized to rate this rental",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
            details: z.object({
              code: RatingErrorCodeSchema,
            }),
          }),
          examples: {
            Unauthorized: {
              value: {
                error: ratingErrorMessages.UNAUTHORIZED_RENTAL_ACCESS,
                details: { code: RatingErrorCodeSchema.enum.UNAUTHORIZED_RENTAL_ACCESS },
              },
            },
          },
        },
      },
    },
    404: {
      description: "Rental not found",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
            details: z.object({
              code: RatingErrorCodeSchema,
            }),
          }),
          examples: {
            NotFound: {
              value: {
                error: ratingErrorMessages.RENTAL_NOT_FOUND,
                details: { code: RatingErrorCodeSchema.enum.RENTAL_NOT_FOUND },
              },
            },
          },
        },
      },
    },
    409: {
      description: "Rating already exists",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
            details: z.object({
              code: RatingErrorCodeSchema,
            }),
          }),
          examples: {
            Duplicate: {
              value: {
                error: ratingErrorMessages.RATING_ALREADY_EXISTS,
                details: { code: RatingErrorCodeSchema.enum.RATING_ALREADY_EXISTS },
              },
            },
          },
        },
      },
    },
  },
});
