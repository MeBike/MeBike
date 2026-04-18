import { createRoute, z } from "@hono/zod-openapi";

import {
  AdminRatingDetailResponseSchema,
  AdminRatingErrorCodeSchema,
  adminRatingErrorMessages,
  AdminRatingErrorResponseSchema,
  ListAdminRatingsQuerySchema,
  ListAdminRatingsResponseSchema,
  RatingErrorCodeSchema,
  RatingReasonsResponseSchema,
  RatingResponseSchema,
  RatingSummaryErrorCodeSchema,
  ratingSummaryErrorMessages,
  RatingSummaryErrorResponseSchema,
  RatingSummaryResponseSchema,
} from "../../ratings/schemas";
import {
  forbiddenResponse,
  notFoundResponse,
  paginatedResponse,
  unauthorizedResponse,
} from "../helpers";

const RatingIdParamSchema = z.object({
  ratingId: z.uuidv7(),
});

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

export const adminListRatingsRoute = createRoute({
  method: "get",
  path: "/v1/admin/ratings",
  tags: ["Admin", "Ratings"],
  security: [{ bearerAuth: [] }],
  request: {
    query: ListAdminRatingsQuerySchema,
  },
  responses: {
    200: {
      ...paginatedResponse(ListAdminRatingsResponseSchema, "List ratings for admin"),
      content: {
        "application/json": {
          schema: ListAdminRatingsResponseSchema,
          examples: {
            Success: {
              value: {
                data: [
                  {
                    id: "0195f9d8-7f4a-7b21-b12a-8c3b5a5d0001",
                    rentalId: "0195f9d8-7f4a-7b21-b12a-8c3b5a5d0002",
                    user: {
                      id: "0195f9d8-7f4a-7b21-b12a-8c3b5a5d0003",
                      fullName: "Nguyen Van An",
                      phoneNumber: "0912345678",
                    },
                    bike: {
                      id: "0195f9d8-7f4a-7b21-b12a-8c3b5a5d0004",
                      bikeNumber: "MB-8821",
                    },
                    station: {
                      id: "0195f9d8-7f4a-7b21-b12a-8c3b5a5d0005",
                      name: "Tram Nguyen Hue, Quan 1",
                      address: "Pho di bo Nguyen Hue",
                    },
                    bikeScore: 4,
                    stationScore: 5,
                    comment: "Xe on nhung khoa hoi cham",
                    reasons: [
                      {
                        id: "0195f9d8-7f4a-7b21-b12a-8c3b5a5d0006",
                        type: "ISSUE",
                        appliesTo: "bike",
                        message: "Phanh hoi yeu",
                      },
                    ],
                    createdAt: "2026-04-04T09:12:00.000Z",
                    updatedAt: "2026-04-04T09:12:00.000Z",
                    editedAt: null,
                  },
                ],
                pagination: {
                  page: 1,
                  pageSize: 20,
                  total: 1,
                  totalPages: 1,
                },
              },
            },
          },
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Admin"),
  },
});

export const adminGetRatingRoute = createRoute({
  method: "get",
  path: "/v1/admin/ratings/{ratingId}",
  tags: ["Admin", "Ratings"],
  security: [{ bearerAuth: [] }],
  request: {
    params: RatingIdParamSchema,
  },
  responses: {
    200: {
      description: "Get rating detail for admin",
      content: {
        "application/json": {
          schema: AdminRatingDetailResponseSchema,
          examples: {
            Success: {
              value: {
                id: "0195f9d8-7f4a-7b21-b12a-8c3b5a5d0001",
                rentalId: "0195f9d8-7f4a-7b21-b12a-8c3b5a5d0002",
                user: {
                  id: "0195f9d8-7f4a-7b21-b12a-8c3b5a5d0003",
                  fullName: "Tran Thi Be",
                  phoneNumber: "0901234567",
                },
                bike: {
                  id: "0195f9d8-7f4a-7b21-b12a-8c3b5a5d0004",
                  bikeNumber: "MB-3342",
                },
                station: {
                  id: "0195f9d8-7f4a-7b21-b12a-8c3b5a5d0005",
                  name: "Tram Le Loi",
                  address: "45 Le Loi",
                },
                rental: {
                  id: "0195f9d8-7f4a-7b21-b12a-8c3b5a5d0002",
                  status: "COMPLETED",
                  startTime: "2026-04-03T09:00:00.000Z",
                  endTime: "2026-04-03T10:00:00.000Z",
                },
                bikeScore: 5,
                stationScore: 5,
                comment: "Rat hai long",
                reasons: [
                  {
                    id: "0195f9d8-7f4a-7b21-b12a-8c3b5a5d0006",
                    type: "COMPLIMENT",
                    appliesTo: "station",
                    message: "Nhan vien ho tro nhanh",
                  },
                ],
                createdAt: "2026-04-04T09:12:00.000Z",
                updatedAt: "2026-04-04T09:12:00.000Z",
                editedAt: null,
              },
            },
          },
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Admin"),
    404: notFoundResponse({
      description: "Rating not found",
      schema: AdminRatingErrorResponseSchema,
      example: {
        error: adminRatingErrorMessages.RATING_NOT_FOUND,
        details: {
          code: AdminRatingErrorCodeSchema.enum.RATING_NOT_FOUND,
          ratingId: "0195f9d8-7f4a-7b21-b12a-8c3b5a5d0001",
        },
      },
    }),
  },
});
