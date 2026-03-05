import { createRoute, z } from "@hono/zod-openapi";

import {
  RatingErrorCodeSchema,
  RatingReasonsResponseSchema,
  RatingResponseSchema,
} from "../../ratings/schemas";
import {
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
  UnauthorizedErrorResponseSchema,
} from "../../schemas";

export const getRatingByRentalRoute = createRoute({
  method: "get",
  path: "/v1/ratings/{rentalId}",
  tags: ["Ratings"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      rentalId: z.uuidv7(),
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

export const getRatingReasonsRoute = createRoute({
  method: "get",
  path: "/v1/ratings/reasons",
  tags: ["Ratings"],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      type: z.enum(["ISSUE", "COMPLIMENT"]).optional(),
      appliesTo: z.enum(["bike", "station", "app"]).optional(),
    }),
  },
  responses: {
    200: {
      description: "Rating reasons",
      content: {
        "application/json": {
          schema: RatingReasonsResponseSchema,
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
