import { createRoute } from "@hono/zod-openapi";

import { z } from "../../../../zod";
import {
  BikeErrorCodeSchema,
  BikeNotFoundResponseSchema,
  BikeReportForbiddenResponseSchema,
  BikeUpdateConflictResponseSchema,
} from "../../bikes";
import {
  BikeIdParamSchema,
  BikeSummarySchemaOpenApi,
  CreateBikeBodySchema,
  UpdateBikeBodySchema,
} from "./shared";

export const createBike = createRoute({
  method: "post",
  path: "/v1/bikes",
  tags: ["Bikes"],
  request: {
    body: {
      content: {
        "application/json": { schema: CreateBikeBodySchema },
      },
    },
  },
  responses: {
    201: {
      description: "Bike created successfully",
      content: {
        "application/json": { schema: BikeSummarySchemaOpenApi },
      },
    },
    400: {
      description: "Invalid input or duplicate chip ID",
      content: {
        "application/json": {
          schema: BikeUpdateConflictResponseSchema,
          examples: {
            DuplicateChipId: {
              value: {
                error: "Duplicate Chip ID",
                details: {
                  code: BikeErrorCodeSchema.enum.DUPLICATE_CHIP_ID,
                },
              },
            },
          },
        },
      },
    },
  },
});

export const updateBike = createRoute({
  method: "patch",
  path: "/v1/bikes/{id}",
  tags: ["Bikes"],
  request: {
    params: BikeIdParamSchema,
    body: {
      content: {
        "application/json": { schema: UpdateBikeBodySchema },
      },
    },
  },
  responses: {
    200: {
      description: "Bike updated successfully",
      content: {
        "application/json": { schema: BikeSummarySchemaOpenApi },
      },
    },
    400: {
      description: "Invalid input or transition blocked",
      content: {
        "application/json": {
          schema: BikeUpdateConflictResponseSchema,
          examples: {
            RentedBlock: {
              value: {
                error: "Bike blocked",
                details: {
                  code: BikeErrorCodeSchema.enum.BIKE_CURRENTLY_RENTED,
                },
              },
            },
          },
        },
      },
    },
    404: {
      description: "Bike not found",
      content: {
        "application/json": { schema: BikeNotFoundResponseSchema },
      },
    },
  },
});

export const deleteBike = createRoute({
  method: "delete",
  path: "/v1/bikes/{id}",
  tags: ["Bikes"],
  request: {
    params: BikeIdParamSchema,
  },
  responses: {
    200: {
      description: "Bike deleted successfully (or soft deleted)",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
    },
    400: {
      description: "Cannot delete bike",
      content: {
        "application/json": { schema: BikeUpdateConflictResponseSchema },
      },
    },
    404: {
      description: "Bike not found",
      content: {
        "application/json": { schema: BikeNotFoundResponseSchema },
      },
    },
  },
});

export const reportBrokenBike = createRoute({
  method: "post",
  path: "/v1/bikes/{id}/report-broken",
  tags: ["Bikes"],
  request: {
    params: BikeIdParamSchema,
  },
  responses: {
    200: {
      description: "Bike reported as broken",
      content: {
        "application/json": { schema: BikeSummarySchemaOpenApi },
      },
    },
    403: {
      description: "User not currently renting the bike",
      content: {
        "application/json": {
          schema: BikeReportForbiddenResponseSchema,
          examples: {
            NotRented: {
              value: {
                error: "Permission denied",
                details: {
                  code: BikeErrorCodeSchema.enum.BIKE_NOT_RENTED_BY_USER,
                },
              },
            },
          },
        },
      },
    },
    404: {
      description: "Bike not found",
      content: {
        "application/json": { schema: BikeNotFoundResponseSchema },
      },
    },
  },
});
