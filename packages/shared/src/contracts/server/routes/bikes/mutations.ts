import { createRoute } from "@hono/zod-openapi";

import { z } from "../../../../zod";
import {
  BikeErrorCodeSchema,
  BikeNotFoundResponseSchema,
  BikeReportForbiddenResponseSchema,
  BikeUpdateConflictResponseSchema,
} from "../../bikes";
import { forbiddenResponse, unauthorizedResponse } from "../helpers";
import {
  BikeIdParamSchema,
  BikeStatusUpdateBodySchema,
  BikeSummarySchemaOpenApi,
  CreateBikeBodySchema,
  UpdateBikeBodySchema,
} from "./shared";

export const createBike = createRoute({
  method: "post",
  path: "/v1/bikes",
  tags: ["Bikes"],
  security: [{ bearerAuth: [] }],
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
      description: "Invalid input",
      content: {
        "application/json": {
          schema: BikeUpdateConflictResponseSchema,
        },
      },
    },
  },
});

export const updateBike = createRoute({
  method: "patch",
  path: "/v1/bikes/{id}",
  tags: ["Bikes"],
  security: [{ bearerAuth: [] }],
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
  security: [{ bearerAuth: [] }],
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

export const managerUpdateBikeStatus = createRoute({
  method: "patch",
  path: "/v1/manager/bikes/{id}/status",
  tags: ["Manager", "Bikes"],
  security: [{ bearerAuth: [] }],
  request: {
    params: BikeIdParamSchema,
    body: {
      content: {
        "application/json": { schema: BikeStatusUpdateBodySchema },
      },
    },
  },
  responses: {
    200: {
      description: "Bike status updated successfully",
      content: {
        "application/json": { schema: BikeSummarySchemaOpenApi },
      },
    },
    400: {
      description: "Invalid bike status transition",
      content: {
        "application/json": {
          schema: BikeUpdateConflictResponseSchema,
          examples: {
            InvalidTransition: {
              value: {
                error: "Invalid bike status transition",
                details: {
                  code: BikeErrorCodeSchema.enum.INVALID_BIKE_STATUS,
                  status: "AVAILABLE",
                },
              },
            },
          },
        },
      },
    },
    404: {
      description: "Bike not found in manager scope",
      content: {
        "application/json": { schema: BikeNotFoundResponseSchema },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Manager"),
  },
});

export const agencyUpdateBikeStatus = createRoute({
  method: "patch",
  path: "/v1/agency/bikes/{id}/status",
  tags: ["Agency", "Bikes"],
  security: [{ bearerAuth: [] }],
  request: {
    params: BikeIdParamSchema,
    body: {
      content: {
        "application/json": { schema: BikeStatusUpdateBodySchema },
      },
    },
  },
  responses: {
    200: {
      description: "Bike status updated successfully",
      content: {
        "application/json": { schema: BikeSummarySchemaOpenApi },
      },
    },
    400: {
      description: "Invalid bike status transition",
      content: {
        "application/json": {
          schema: BikeUpdateConflictResponseSchema,
          examples: {
            InvalidTransition: {
              value: {
                error: "Invalid bike status transition",
                details: {
                  code: BikeErrorCodeSchema.enum.INVALID_BIKE_STATUS,
                  status: "BROKEN",
                },
              },
            },
          },
        },
      },
    },
    404: {
      description: "Bike not found in agency scope",
      content: {
        "application/json": { schema: BikeNotFoundResponseSchema },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Agency"),
  },
});

export const technicianUpdateBikeStatus = createRoute({
  method: "patch",
  path: "/v1/technician/bikes/{id}/status",
  tags: ["Technician", "Bikes"],
  security: [{ bearerAuth: [] }],
  request: {
    params: BikeIdParamSchema,
    body: {
      content: {
        "application/json": { schema: BikeStatusUpdateBodySchema },
      },
    },
  },
  responses: {
    200: {
      description: "Bike status updated successfully",
      content: {
        "application/json": { schema: BikeSummarySchemaOpenApi },
      },
    },
    400: {
      description: "Invalid bike status transition",
      content: {
        "application/json": {
          schema: BikeUpdateConflictResponseSchema,
          examples: {
            InvalidTransition: {
              value: {
                error: "Invalid bike status transition",
                details: {
                  code: BikeErrorCodeSchema.enum.INVALID_BIKE_STATUS,
                  status: "BROKEN",
                },
              },
            },
          },
        },
      },
    },
    404: {
      description: "Bike not found in technician scope",
      content: {
        "application/json": { schema: BikeNotFoundResponseSchema },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Technician"),
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
