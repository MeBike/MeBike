import { createRoute, z } from "@hono/zod-openapi";

import {
  CreateRatingRequestSchema,
  CreateRatingResponseSchema,
  RatingErrorCodeSchema,
  ratingErrorMessages,
  RatingResponseSchema,
} from "./schemas";

export const createRatingRoute = createRoute({
  method: "post",
  path: "/v1/ratings/{rentalId}",
  tags: ["Ratings"],
  request: {
    params: z.object({
      rentalId: z.string(),
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

export const getRatingByRentalRoute = createRoute({
  method: "get",
  path: "/v1/ratings/{rentalId}",
  tags: ["Ratings"],
  request: {
    params: z.object({
      rentalId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Rating for rental",
      content: {
        "application/json": {
          schema: RatingResponseSchema,
        },
      },
    },
    404: {
      description: "Rating not found",
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
                error: "Rating not found",
                details: { code: RatingErrorCodeSchema.enum.RENTAL_NOT_FOUND },
              },
            },
          },
        },
      },
    },
  },
});

export const ratingsRoutes = {
  create: createRatingRoute,
  getByRental: getRatingByRentalRoute,
} as const;

export type CreateRatingResponse = z.infer<typeof CreateRatingResponseSchema>;
export type RatingResponse = z.infer<typeof RatingResponseSchema>;
export type RatingErrorResponse = {
  error: string;
  details: {
    code: z.infer<typeof RatingErrorCodeSchema>;
  };
};
