import { createRoute, z } from "@hono/zod-openapi";

import {
  RatingErrorCodeSchema,
  RatingReasonsResponseSchema,
  RatingResponseSchema,
  RatingSummaryErrorCodeSchema,
  ratingSummaryErrorMessages,
  RatingSummaryErrorResponseSchema,
  RatingSummaryResponseSchema,
} from "../../ratings/schemas";
import {
} from "../../schemas";
import { unauthorizedResponse } from "../helpers";

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
    401: unauthorizedResponse(),
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
      appliesTo: z.enum(["bike", "station"]).optional(),
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
    401: unauthorizedResponse(),
  },
});

export const getBikeRatingSummaryRoute = createRoute({
  method: "get",
  path: "/v1/ratings/bikes/{bikeId}/summary",
  tags: ["Ratings"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      bikeId: z.uuidv7(),
    }),
  },
  responses: {
    200: {
      description: "Bike rating summary",
      content: {
        "application/json": {
          schema: RatingSummaryResponseSchema,
        },
      },
    },
    401: unauthorizedResponse(),
    404: {
      description: "Bike not found",
      content: {
        "application/json": {
          schema: RatingSummaryErrorResponseSchema,
          examples: {
            NotFound: {
              value: {
                error: ratingSummaryErrorMessages.BIKE_NOT_FOUND,
                details: { code: RatingSummaryErrorCodeSchema.enum.BIKE_NOT_FOUND },
              },
            },
          },
        },
      },
    },
  },
});

export const getStationRatingSummaryRoute = createRoute({
  method: "get",
  path: "/v1/ratings/stations/{stationId}/summary",
  tags: ["Ratings"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      stationId: z.uuidv7(),
    }),
  },
  responses: {
    200: {
      description: "Station rating summary",
      content: {
        "application/json": {
          schema: RatingSummaryResponseSchema,
        },
      },
    },
    401: unauthorizedResponse(),
    404: {
      description: "Station not found",
      content: {
        "application/json": {
          schema: RatingSummaryErrorResponseSchema,
          examples: {
            NotFound: {
              value: {
                error: ratingSummaryErrorMessages.STATION_NOT_FOUND,
                details: { code: RatingSummaryErrorCodeSchema.enum.STATION_NOT_FOUND },
              },
            },
          },
        },
      },
    },
  },
});
