import { createRoute } from "@hono/zod-openapi";

import { z } from "../../../../zod";
import { AdminRentalsListResponseSchema } from "../../rentals";
import {
  paginationQueryFields,
  SortDirectionSchema,
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
  UnauthorizedErrorResponseSchema,
} from "../../schemas";
import {
  createSuccessResponse,
  DashboardResponseSchema,
  MyRentalListResponseSchema,
  PhoneNumberParamSchema,
  RentalCountsResponseSchema,
  rentalDateRangeWith,
  RentalDetailSchemaOpenApi,
  RentalErrorCodeSchema,
  RentalErrorResponseSchema,
  RentalIdParamSchema,
  RentalListQuerySchema,
  RentalListResponseSchema,
  RentalRevenueResponseSchema,
  RentalSchemaOpenApi,
  RentalStatsQuerySchema,
  RentalStatusSchema,
  StationActivityResponseSchema,
  UserIdParamSchema,
} from "./shared";

export const getMyRentals = createRoute({
  method: "get",
  path: "/v1/rentals/me",
  tags: ["Rentals"],
  security: [{ bearerAuth: [] }],
  request: {
    query: RentalListQuerySchema,
  },
  responses: {
    200: {
      description: "User's rental list",
      content: {
        "application/json": {
          schema: MyRentalListResponseSchema,
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

export const getMyCurrentRentals = createRoute({
  method: "get",
  path: "/v1/rentals/me/current",
  tags: ["Rentals"],
  security: [{ bearerAuth: [] }],
  request: {
    query: RentalListQuerySchema,
  },
  responses: {
    200: {
      description: "User's current active rentals",
      content: {
        "application/json": {
          schema: MyRentalListResponseSchema,
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

export const getMyRentalCounts = createRoute({
  method: "get",
  path: "/v1/rentals/me/counts",
  tags: ["Rentals"],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      status: RentalStatusSchema.optional(),
    }),
  },
  responses: {
    200: {
      description: "Rental counts by status",
      content: {
        "application/json": {
          schema: RentalCountsResponseSchema,
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

export const getMyRental = createRoute({
  method: "get",
  path: "/v1/rentals/me/{rentalId}",
  tags: ["Rentals"],
  security: [{ bearerAuth: [] }],
  request: {
    params: RentalIdParamSchema,
  },
  responses: {
    200: {
      description: "User's detailed rental",
      content: {
        "application/json": {
          schema: createSuccessResponse(
            RentalSchemaOpenApi,
            "Get rental detail response",
          ),
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
      description: "Rental not found",
      content: {
        "application/json": {
          schema: RentalErrorResponseSchema,
          examples: {
            RentalNotFound: {
              value: {
                error: "Không tìm thấy phiên thuê nào với Id",
                details: {
                  code: RentalErrorCodeSchema.enum.RENTAL_NOT_FOUND,
                  rentalId: "665fd6e36b7e5d53f8f3d2c9",
                },
              },
            },
            AccessDenied: {
              value: {
                error: "Bạn không có quyền truy cập tài nguyên này",
                details: {
                  code: RentalErrorCodeSchema.enum.ACCESS_DENIED,
                  rentalId: "665fd6e36b7e5d53f8f3d2c9",
                },
              },
            },
          },
        },
      },
    },
  },
});

export const getAllRentals = createRoute({
  method: "get",
  path: "/v1/rentals",
  tags: ["Rentals"],
  request: {
    query: RentalListQuerySchema,
  },
  responses: {
    200: {
      description: "All rentals (admin/staff view)",
      content: {
        "application/json": {
          schema: RentalListResponseSchema,
        },
      },
    },
  },
});

export const getRental = createRoute({
  method: "get",
  path: "/v1/rentals/{rentalId}",
  tags: ["Rentals"],
  request: {
    params: RentalIdParamSchema,
  },
  responses: {
    200: {
      description: "Detailed rental (admin/staff view)",
      content: {
        "application/json": {
          schema: createSuccessResponse(
            RentalSchemaOpenApi,
            "Get rental detail response",
          ),
        },
      },
    },
    404: {
      description: "Rental not found",
      content: {
        "application/json": {
          schema: RentalErrorResponseSchema,
          examples: {
            RentalNotFound: {
              value: {
                error: "Không tìm thấy phiên thuê nào với Id",
                details: {
                  code: RentalErrorCodeSchema.enum.RENTAL_NOT_FOUND,
                  rentalId: "665fd6e36b7e5d53f8f3d2c9",
                },
              },
            },
          },
        },
      },
    },
  },
});

export const getRentalsByUser = createRoute({
  method: "get",
  path: "/v1/rentals/users/{userId}",
  tags: ["Rentals"],
  request: {
    params: UserIdParamSchema,
    query: RentalListQuerySchema,
  },
  responses: {
    200: {
      description: "Rentals by user ID",
      content: {
        "application/json": {
          schema: RentalListResponseSchema,
        },
      },
    },
    404: {
      description: "User not found",
      content: {
        "application/json": {
          schema: RentalErrorResponseSchema,
          examples: {
            UserNotFound: {
              value: {
                error: "Không tìm thấy người dùng với Id",
                details: {
                  code: RentalErrorCodeSchema.enum.USER_NOT_FOUND,
                  userId: "665fd6e36b7e5d53f8f3d2c9",
                },
              },
            },
          },
        },
      },
    },
  },
});

export const getActiveRentalsByPhone = createRoute({
  method: "get",
  path: "/v1/rentals/by-phone/{number}/active",
  tags: ["Rentals"],
  request: {
    params: PhoneNumberParamSchema,
    query: RentalListQuerySchema,
  },
  responses: {
    200: {
      description: "Active rentals by phone number",
      content: {
        "application/json": {
          schema: RentalListResponseSchema,
        },
      },
    },
  },
});

export const getDashboardSummary = createRoute({
  method: "get",
  path: "/v1/rentals/dashboard-summary",
  tags: ["Rentals"],
  responses: {
    200: {
      description: "Dashboard summary statistics",
      content: {
        "application/json": {
          schema: DashboardResponseSchema,
        },
      },
    },
  },
});

export const getRentalSummary = createRoute({
  method: "get",
  path: "/v1/rentals/summary",
  tags: ["Rentals"],
  responses: {
    200: {
      description: "Rental summary by status",
      content: {
        "application/json": {
          schema: RentalCountsResponseSchema,
        },
      },
    },
  },
});

export const getRentalRevenue = createRoute({
  method: "get",
  path: "/v1/rentals/stats/revenue",
  tags: ["Rentals"],
  request: {
    query: RentalStatsQuerySchema,
  },
  responses: {
    200: {
      description: "Rental revenue statistics",
      content: {
        "application/json": {
          schema: RentalRevenueResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid date range",
      content: {
        "application/json": {
          schema: RentalErrorResponseSchema,
          examples: {
            InvalidDateRange: {
              value: {
                error: "Invalid date range",
                details: {
                  code: RentalErrorCodeSchema.enum.INVALID_OBJECT_ID,
                  from: "2025-02-10T00:00:00.000Z",
                  to: "2025-02-01T00:00:00.000Z",
                },
              },
            },
          },
        },
      },
    },
  },
});

export const getStationActivity = createRoute({
  method: "get",
  path: "/v1/rentals/stats/station-activity",
  tags: ["Rentals"],
  request: {
    query: rentalDateRangeWith({
      stationId: z.uuidv7().optional(),
    }),
  },
  responses: {
    200: {
      description: "Station activity statistics",
      content: {
        "application/json": {
          schema: StationActivityResponseSchema,
        },
      },
    },
  },
});

export const adminListRentals = createRoute({
  method: "get",
  path: "/v1/admin/rentals",
  tags: ["Admin", "Rentals"],
  security: [{ bearerAuth: [] }],
  request: {
    query: z
      .object({
        userId: z.uuidv7().optional(),
        bikeId: z.uuidv7().optional(),
        startStation: z.uuidv7().optional(),
        endStation: z.uuidv7().optional(),
        status: RentalStatusSchema.optional(),
        ...paginationQueryFields,
        sortBy: z.enum(["startTime", "endTime", "status", "updatedAt"]).optional(),
        sortDir: SortDirectionSchema.optional(),
      })
      .openapi("AdminRentalsListQuery", {
        description: "Query parameters for admin rental listing",
      }),
  },
  responses: {
    200: {
      description: "Paginated list of all rentals (admin view)",
      content: {
        "application/json": {
          schema: AdminRentalsListResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: UnauthorizedErrorResponseSchema,
        },
      },
    },
    403: {
      description: "Forbidden - Admin access required",
      content: {
        "application/json": {
          schema: UnauthorizedErrorResponseSchema,
        },
      },
    },
  },
});

export const adminGetRental = createRoute({
  method: "get",
  path: "/v1/admin/rentals/{rentalId}",
  tags: ["Admin", "Rentals"],
  security: [{ bearerAuth: [] }],
  request: {
    params: RentalIdParamSchema,
  },
  responses: {
    200: {
      description: "Detailed rental with all populated data (admin view)",
      content: {
        "application/json": {
          schema: createSuccessResponse(
            RentalDetailSchemaOpenApi,
            "Get admin rental detail response",
          ),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: UnauthorizedErrorResponseSchema,
        },
      },
    },
    403: {
      description: "Forbidden - Admin access required",
      content: {
        "application/json": {
          schema: UnauthorizedErrorResponseSchema,
        },
      },
    },
    404: {
      description: "Rental not found",
      content: {
        "application/json": {
          schema: RentalErrorResponseSchema,
        },
      },
    },
  },
});

export const staffGetRental = createRoute({
  method: "get",
  path: "/v1/staff/rentals/{rentalId}",
  tags: ["Staff", "Rentals"],
  security: [{ bearerAuth: [] }],
  request: {
    params: RentalIdParamSchema,
  },
  responses: {
    200: {
      description: "Detailed rental with all populated data (staff view)",
      content: {
        "application/json": {
          schema: createSuccessResponse(
            RentalDetailSchemaOpenApi,
            "Get staff rental detail response",
          ),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: UnauthorizedErrorResponseSchema,
        },
      },
    },
    403: {
      description: "Forbidden - Staff access required",
      content: {
        "application/json": {
          schema: UnauthorizedErrorResponseSchema,
        },
      },
    },
    404: {
      description: "Rental not found",
      content: {
        "application/json": {
          schema: RentalErrorResponseSchema,
        },
      },
    },
  },
});
