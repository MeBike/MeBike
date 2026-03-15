import { createRoute } from "@hono/zod-openapi";

import { z } from "../../../../zod";
import {
  AdminRentalsListResponseSchema,
  BikeSwapRequestErrorResponseSchema,
  BikeSwapRequestListResponseSchema,
  BikeSwapStatusSchema,
} from "../../rentals";
import {
  paginationQueryFields,
  SortDirectionSchema,
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
  UnauthorizedErrorResponseSchema,
} from "../../schemas";
import {
  BikeSwapRequestDetailSchemaOpenApi,
  BikeSwapRequestIdParamSchema,
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
  RentalSummaryStatsResponseSchema,
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
                details: {
                  code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED,
                },
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
                details: {
                  code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED,
                },
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
                details: {
                  code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED,
                },
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
          schema: RentalSchemaOpenApi,
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
                details: {
                  code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED,
                },
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
  description:
    "Revenue series for completed rentals. Defaults when query is omitted: groupBy=DAY and period = previous full calendar month (UTC).",
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

export const getRentalStatsSummary = createRoute({
  method: "get",
  path: "/v1/rentals/stats/summary",
  tags: ["Rentals"],
  responses: {
    200: {
      description: "Rental status and revenue summary",
      content: {
        "application/json": {
          schema: RentalSummaryStatsResponseSchema,
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
        sortBy: z
          .enum(["startTime", "endTime", "status", "updatedAt"])
          .optional(),
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
          examples: {
            Success: {
              value: {
                data: [
                  {
                    id: "019b17bd-d130-7e7d-be69-91ceef7b6959",
                    user: {
                      id: "019b17bd-d130-7e7d-be69-91ceef7b6999",
                      fullname: "Nguyen Van A",
                    },
                    bikeId: "019b17bd-d130-7e7d-be69-91ceef7b6888",
                    status: "COMPLETED",
                    startStation: "019b17bd-d130-7e7d-be69-91ceef7b6111",
                    endStation: "019b17bd-d130-7e7d-be69-91ceef7b6222",
                    createdAt: "2026-03-10T09:10:00.000Z",
                    startTime: "2026-03-10T09:10:00.000Z",
                    endTime: "2026-03-10T10:25:00.000Z",
                    duration: 75,
                    totalPrice: 30000,
                    subscriptionId: "019b17bd-d130-7e7d-be69-91ceef7b6333",
                    updatedAt: "2026-03-10T10:25:00.000Z",
                  },
                ],
                pagination: {
                  page: 1,
                  pageSize: 10,
                  total: 1,
                  totalPages: 1,
                },
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
          schema: RentalDetailSchemaOpenApi,
          examples: {
            Success: {
              value: {
                id: "019b17bd-d130-7e7d-be69-91ceef7b6959",
                user: {
                  id: "019b17bd-d130-7e7d-be69-91ceef7b6999",
                  fullname: "Nguyen Van A",
                  email: "user@example.com",
                  verify: "VERIFIED",
                  location: "Ho Chi Minh City",
                  username: "nguyenvana",
                  phoneNumber: "0901234567",
                  avatar: "https://example.com/avatar.png",
                  role: "USER",
                  nfcCardUid: "NFC-0001",
                  updatedAt: "2026-03-10T09:00:00.000Z",
                },
                bike: {
                  id: "019b17bd-d130-7e7d-be69-91ceef7b6888",
                  chipId: "CHIP-001",
                  status: "AVAILABLE",
                  supplierId: "019b17bd-d130-7e7d-be69-91ceef7b6777",
                  updatedAt: "2026-03-10T09:05:00.000Z",
                },
                startStation: {
                  id: "019b17bd-d130-7e7d-be69-91ceef7b6111",
                  name: "Ben Thanh Station",
                  address: "District 1, Ho Chi Minh City",
                  latitude: 10.772,
                  longitude: 106.698,
                  capacity: 30,
                  updatedAt: "2026-03-10T08:00:00.000Z",
                },
                endStation: {
                  id: "019b17bd-d130-7e7d-be69-91ceef7b6222",
                  name: "Tao Dan Station",
                  address: "District 1, Ho Chi Minh City",
                  latitude: 10.776,
                  longitude: 106.691,
                  capacity: 25,
                  updatedAt: "2026-03-10T08:00:00.000Z",
                },
                startTime: "2026-03-10T09:10:00.000Z",
                endTime: "2026-03-10T10:25:00.000Z",
                duration: 75,
                totalPrice: 30000,
                subscriptionId: "019b17bd-d130-7e7d-be69-91ceef7b6333",
                status: "COMPLETED",
                updatedAt: "2026-03-10T10:25:00.000Z",
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
          schema: RentalDetailSchemaOpenApi,
          examples: {
            Success: {
              value: {
                id: "019b17bd-d130-7e7d-be69-91ceef7b6959",
                user: {
                  id: "019b17bd-d130-7e7d-be69-91ceef7b6999",
                  fullname: "Nguyen Van A",
                  email: "user@example.com",
                  verify: "VERIFIED",
                  location: "Ho Chi Minh City",
                  username: "nguyenvana",
                  phoneNumber: "0901234567",
                  avatar: "https://example.com/avatar.png",
                  role: "USER",
                  nfcCardUid: "NFC-0001",
                  updatedAt: "2026-03-10T09:00:00.000Z",
                },
                bike: {
                  id: "019b17bd-d130-7e7d-be69-91ceef7b6888",
                  chipId: "CHIP-001",
                  status: "AVAILABLE",
                  supplierId: "019b17bd-d130-7e7d-be69-91ceef7b6777",
                  updatedAt: "2026-03-10T09:05:00.000Z",
                },
                startStation: {
                  id: "019b17bd-d130-7e7d-be69-91ceef7b6111",
                  name: "Ben Thanh Station",
                  address: "District 1, Ho Chi Minh City",
                  latitude: 10.772,
                  longitude: 106.698,
                  capacity: 30,
                  updatedAt: "2026-03-10T08:00:00.000Z",
                },
                endStation: {
                  id: "019b17bd-d130-7e7d-be69-91ceef7b6222",
                  name: "Tao Dan Station",
                  address: "District 1, Ho Chi Minh City",
                  latitude: 10.776,
                  longitude: 106.691,
                  capacity: 25,
                  updatedAt: "2026-03-10T08:00:00.000Z",
                },
                startTime: "2026-03-10T09:10:00.000Z",
                endTime: "2026-03-10T10:25:00.000Z",
                duration: 75,
                totalPrice: 30000,
                subscriptionId: "019b17bd-d130-7e7d-be69-91ceef7b6333",
                status: "COMPLETED",
                updatedAt: "2026-03-10T10:25:00.000Z",
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

export const staffListBikeSwapRequests = createRoute({
  method: "get",
  path: "/v1/staff/bike-swap-requests",
  tags: ["Staff", "Bike Swap"],
  security: [{ bearerAuth: [] }],
  request: {
    query: z
      .object({
        userId: z.uuidv7().optional(),
        status: BikeSwapStatusSchema.optional(),
        ...paginationQueryFields,
        sortBy: z.enum(["status", "updatedAt"]).optional(),
        sortDir: SortDirectionSchema.optional(),
      })
      .openapi("StaffBikeSwapRequestsListQuery", {
        description: "Query parameters for staff bike swap requests listing",
      }),
  },
  responses: {
    200: {
      description: "List of bike swap requests",
      content: {
        "application/json": {
          schema: BikeSwapRequestListResponseSchema,
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
  },
});

export const adminListBikeSwapRequests = createRoute({
  method: "get",
  path: "/v1/admin/bike-swap-requests",
  tags: ["Bike Swap"],
  security: [{ bearerAuth: [] }],
  request: {
    query: z
      .object({
        userId: z.uuidv7().optional(),
        status: BikeSwapStatusSchema.optional(),
        ...paginationQueryFields,
        sortBy: z.enum(["status", "updatedAt"]).optional(),
        sortDir: SortDirectionSchema.optional(),
      })
      .openapi("AdminBikeSwapRequestsListQuery", {
        description: "Query parameters for admin bike swap requests listing",
      }),
  },
  responses: {
    200: {
      description: "List of bike swap requests",
      content: {
        "application/json": {
          schema: BikeSwapRequestListResponseSchema,
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

export const adminGetBikeSwapRequests = createRoute({
  method: "get",
  path: "/v1/admin/bike-swap-requests/{bikeSwapRequestId}",
  tags: ["Bike Swap"],
  security: [{ bearerAuth: [] }],
  request: {
    params: BikeSwapRequestIdParamSchema,
  },
  responses: {
    200: {
      description: "Detailed rental with all populated data (admin view)",
      content: {
        "application/json": {
          schema: createSuccessResponse(
            BikeSwapRequestDetailSchemaOpenApi,
            "Get admin bike swap request detail response",
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
      description: "Bike swap request not found",
      content: {
        "application/json": {
          schema: BikeSwapRequestErrorResponseSchema,
        },
      },
    },
  },
});

export const staffGetBikeSwapRequests = createRoute({
  method: "get",
  path: "/v1/staff/bike-swap-requests/{bikeSwapRequestId}",
  tags: ["Bike Swap"],
  security: [{ bearerAuth: [] }],
  request: {
    params: BikeSwapRequestIdParamSchema,
  },
  responses: {
    200: {
      description: "Detailed rental with all populated data (staff view)",
      content: {
        "application/json": {
          schema: createSuccessResponse(
            BikeSwapRequestDetailSchemaOpenApi,
            "Get staff bike swap request detail response",
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
      description: "Bike swap request not found",
      content: {
        "application/json": {
          schema: BikeSwapRequestErrorResponseSchema,
        },
      },
    },
  },
});
