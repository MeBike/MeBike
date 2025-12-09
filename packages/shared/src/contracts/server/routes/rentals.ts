import { createRoute } from "@hono/zod-openapi";

import { z } from "../../../zod";
import {
  CancelRentalRequestSchema,
  CardTapRentalRequestSchema,
  CreateRentalRequestSchema,
  DashboardResponseSchema,
  EndRentalRequestSchema,
  RentalDateRangeQuerySchema as ImportedRentalDateRangeQuerySchema,
  RentalCountsResponseSchema,
  RentalDetailSchema,
  RentalErrorCodeSchema,
  RentalErrorDetailSchema,
  RentalIsoDateTimeStringSchema,
  RentalListItemSchema,
  RentalRevenueResponseSchema,
  RentalSchema,
  RentalStatusSchema,
  RentalWithPriceSchema,
  RentalWithPricingSchema,
  StaffCreateRentalRequestSchema,
  StationActivityResponseSchema,
  UpdateRentalRequestSchema,
} from "../rentals";
import { ServerErrorResponseSchema } from "../schemas";

const RentalErrorResponseSchema = ServerErrorResponseSchema.extend({
  details: RentalErrorDetailSchema.optional(),
}).openapi("RentalErrorResponse", {
  description: "Standard error payload for rental endpoints",
});

function rentalDateRangeWith<T extends z.ZodRawShape>(extra: T) {
  const base = z.object({
    from: RentalIsoDateTimeStringSchema.optional(),
    to: RentalIsoDateTimeStringSchema.optional(),
    ...extra,
  });

  return base.refine(
    (value: any) =>
      !(value.from && value.to && new Date(value.from) > new Date(value.to)),
    {
      message: "from must not be after to",
      path: ["from"],
    },
  );
}

// Common parameter schemas
const RentalIdParamSchema = z
  .object({
    rentalId: z.string().openapi({
      example: "665fd6e36b7e5d53f8f3d2c9",
      description: "Rental identifier",
    }),
  })
  .openapi("RentalIdParam", {
    description: "Path params for rental id",
  });

const UserIdParamSchema = z
  .object({
    userId: z.string().openapi({
      example: "665fd6e36b7e5d53f8f3d2c9",
      description: "User identifier",
    }),
  })
  .openapi("UserIdParam", {
    description: "Path params for user id",
  });

const PhoneNumberParamSchema = z
  .object({
    number: z.string().openapi({
      example: "0901234567",
      description: "Phone number",
    }),
  })
  .openapi("PhoneNumberParam", {
    description: "Path params for phone number",
  });

const SOSIdParamSchema = z
  .object({
    sosId: z.string().openapi({
      example: "665fd6e36b7e5d53f8f3d2c9",
      description: "SOS alert identifier",
    }),
  })
  .openapi("SOSIdParam", {
    description: "Path params for SOS alert id",
  });

// Query schemas for listing and filtering
const RentalListQuerySchema = z
  .object({
    start_station: z.string().optional(),
    end_station: z.string().optional(),
    status: RentalStatusSchema.optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  })
  .openapi("RentalListQuery", {
    description: "Query parameters for rental listing",
  });

const RentalStatsQuerySchema = rentalDateRangeWith({
  groupBy: z.enum(["NGÀY", "THÁNG", "NĂM"]).optional(),
}).openapi("RentalStatsQuery", {
  description: "Query parameters for rental statistics",
});

// Response schemas with OpenAPI definitions
const RentalSchemaOpenApi = RentalSchema.openapi("Rental", {
  description: "Basic rental information",
});

const RentalWithPriceSchemaOpenApi = RentalWithPriceSchema.openapi(
  "RentalWithPrice",
  {
    description: "Rental with calculated pricing",
  },
);

const RentalDetailSchemaOpenApi = RentalDetailSchema.openapi("RentalDetail", {
  description: "Detailed rental with populated user, bike, and station data",
});

const RentalWithPricingSchemaOpenApi = RentalWithPricingSchema.openapi(
  "RentalWithPricing",
  {
    description: "Detailed rental with enhanced pricing information",
  },
);

const RentalListItemSchemaOpenApi = RentalListItemSchema.openapi(
  "RentalListItem",
  {
    description: "Rental item for paginated lists",
  },
);

// Standard response wrapper
const RentalListResponseSchema = z
  .object({
    data: z.array(RentalListItemSchemaOpenApi),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  })
  .openapi("RentalListResponse", {
    description: "Paginated rental list",
  });

const MyRentalListResponseSchema = z
  .object({
    data: z.array(RentalSchemaOpenApi),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  })
  .openapi("MyRentalListResponse", {
    description: "Paginated user rental list",
  });

// Standard success response wrapper
function createSuccessResponse<T extends z.ZodType>(dataSchema: T, description: string) {
  return z
    .object({
      message: z.string(),
      result: dataSchema,
    })
    .openapi("SuccessResponse", { description });
}

export const rentalsRoutes = {
  // User-facing endpoints
  createRental: createRoute({
    method: "post",
    path: "/v1/rentals",
    tags: ["Rentals"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: CreateRentalRequestSchema.openapi("CreateRentalRequest"),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Rental created successfully",
        content: {
          "application/json": {
            schema: createSuccessResponse(
              RentalWithPriceSchemaOpenApi,
              "Create rental response",
            ),
          },
        },
      },
      400: {
        description: "Invalid request or rental cannot be created",
        content: {
          "application/json": {
            schema: RentalErrorResponseSchema,
            examples: {
              BikeNotAvailable: {
                value: {
                  error: "Bike is not available for rental",
                  details: {
                    code: RentalErrorCodeSchema.enum.BIKE_IN_USE,
                    bikeId: "665fd6e36b7e5d53f8f3d2c9",
                  },
                },
              },
              InsufficientBalance: {
                value: {
                  error: "Tài khoản của bạn không đủ để bắt đầu phiên thuê",
                  details: {
                    code: RentalErrorCodeSchema.enum.NOT_ENOUGH_BALANCE_TO_RENT,
                    requiredBalance: 5000,
                    currentBalance: 2000,
                  },
                },
              },
            },
          },
        },
      },
    },
  }),

  getMyRentals: createRoute({
    method: "get",
    path: "/v1/rentals/me",
    tags: ["Rentals"],
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
    },
  }),

  getMyCurrentRentals: createRoute({
    method: "get",
    path: "/v1/rentals/me/current",
    tags: ["Rentals"],
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
    },
  }),

  getMyRentalCounts: createRoute({
    method: "get",
    path: "/v1/rentals/me/counts",
    tags: ["Rentals"],
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
    },
  }),

  getMyRental: createRoute({
    method: "get",
    path: "/v1/rentals/me/{rentalId}",
    tags: ["Rentals"],
    request: {
      params: RentalIdParamSchema,
    },
    responses: {
      200: {
        description: "User's detailed rental",
        content: {
          "application/json": {
            schema: createSuccessResponse(
              RentalDetailSchemaOpenApi,
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
  }),

  endMyRental: createRoute({
    method: "put",
    path: "/v1/rentals/me/{rentalId}/end",
    tags: ["Rentals"],
    request: {
      params: RentalIdParamSchema,
      body: {
        content: {
          "application/json": {
            schema: z
              .object({
                end_station: z.string(),
              })
              .openapi("EndMyRentalRequest"),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Rental ended successfully",
        content: {
          "application/json": {
            schema: createSuccessResponse(
              RentalWithPricingSchemaOpenApi,
              "End rental response",
            ),
          },
        },
      },
      400: {
        description: "Cannot end rental",
        content: {
          "application/json": {
            schema: RentalErrorResponseSchema,
            examples: {
              RentalNotFound: {
                value: {
                  error: "Không tìm thấy phiên thuê nào đang diễn ra",
                  details: {
                    code: RentalErrorCodeSchema.enum.NOT_FOUND_RENTED_RENTAL,
                    rentalId: "665fd6e36b7e5d53f8f3d2c9",
                  },
                },
              },
              AccessDenied: {
                value: {
                  error: "Bạn không có quyền kết thúc phiên thuê của người khác",
                  details: {
                    code: RentalErrorCodeSchema.enum.CANNOT_END_OTHER_RENTAL,
                    rentalId: "665fd6e36b7e5d53f8f3d2c9",
                  },
                },
              },
            },
          },
        },
      },
    },
  }),

  // Admin/Staff endpoints
  staffCreateRental: createRoute({
    method: "post",
    path: "/v1/rentals/staff-create",
    tags: ["Rentals"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: StaffCreateRentalRequestSchema.openapi(
              "StaffCreateRentalRequest",
            ),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Rental created by staff",
        content: {
          "application/json": {
            schema: createSuccessResponse(
              RentalWithPriceSchemaOpenApi,
              "Staff create rental response",
            ),
          },
        },
      },
      400: {
        description: "Cannot create rental",
        content: {
          "application/json": {
            schema: RentalErrorResponseSchema,
          },
        },
      },
    },
  }),

  createRentalFromSOS: createRoute({
    method: "post",
    path: "/v1/rentals/sos/{sosId}",
    tags: ["Rentals"],
    request: {
      params: SOSIdParamSchema,
    },
    responses: {
      200: {
        description: "Rental created from SOS alert",
        content: {
          "application/json": {
            schema: createSuccessResponse(
              RentalWithPriceSchemaOpenApi,
              "Create rental from SOS response",
            ),
          },
        },
      },
      400: {
        description: "Cannot create rental from SOS",
        content: {
          "application/json": {
            schema: RentalErrorResponseSchema,
            examples: {
              SOSNotFound: {
                value: {
                  error: "Không tìm thấy yêu cầu cứu hộ nào",
                  details: {
                    code: RentalErrorCodeSchema.enum.SOS_NOT_FOUND,
                    sosId: "665fd6e36b7e5d53f8f3d2c9",
                  },
                },
              },
              InvalidSOSStatus: {
                value: {
                  error: "Nhân viên chỉ có thể tạo phiên thuê bởi yêu cầu mà người cứu hộ không xử lí được",
                  details: {
                    code: RentalErrorCodeSchema.enum.CANNOT_CREATE_RENTAL_WITH_SOS_STATUS,
                    sosId: "665fd6e36b7e5d53f8f3d2c9",
                  },
                },
              },
            },
          },
        },
      },
    },
  }),

  getAllRentals: createRoute({
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
  }),

  getRental: createRoute({
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
              RentalDetailSchemaOpenApi,
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
  }),

  updateRental: createRoute({
    method: "put",
    path: "/v1/rentals/{rentalId}",
    tags: ["Rentals"],
    request: {
      params: RentalIdParamSchema,
      body: {
        content: {
          "application/json": {
            schema: UpdateRentalRequestSchema.openapi("UpdateRentalRequest"),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Rental updated successfully",
        content: {
          "application/json": {
            schema: createSuccessResponse(
              RentalDetailSchemaOpenApi,
              "Update rental response",
            ),
          },
        },
      },
      400: {
        description: "Cannot update rental",
        content: {
          "application/json": {
            schema: RentalErrorResponseSchema,
            examples: {
              CannotEditWithStatus: {
                value: {
                  error: "Không thể chỉnh sửa phiên thuê đang ở trạng thái",
                  details: {
                    code: RentalErrorCodeSchema.enum.CANNOT_EDIT_THIS_RENTAL_WITH_STATUS,
                    rentalId: "665fd6e36b7e5d53f8f3d2c9",
                    status: "HOÀN THÀNH",
                  },
                },
              },
            },
          },
        },
      },
    },
  }),

  endRentalByAdmin: createRoute({
    method: "put",
    path: "/v1/rentals/{rentalId}/end",
    tags: ["Rentals"],
    request: {
      params: RentalIdParamSchema,
      body: {
        content: {
          "application/json": {
            schema: EndRentalRequestSchema.openapi("EndRentalRequest"),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Rental ended by admin/staff",
        content: {
          "application/json": {
            schema: createSuccessResponse(
              RentalWithPricingSchemaOpenApi,
              "End rental by admin response",
            ),
          },
        },
      },
      400: {
        description: "Cannot end rental",
        content: {
          "application/json": {
            schema: RentalErrorResponseSchema,
          },
        },
      },
    },
  }),

  cancelRental: createRoute({
    method: "post",
    path: "/v1/rentals/{rentalId}/cancel",
    tags: ["Rentals"],
    request: {
      params: RentalIdParamSchema,
      body: {
        content: {
          "application/json": {
            schema: CancelRentalRequestSchema.openapi("CancelRentalRequest"),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Rental cancelled successfully",
        content: {
          "application/json": {
            schema: createSuccessResponse(
              RentalDetailSchemaOpenApi,
              "Cancel rental response",
            ),
          },
        },
      },
      400: {
        description: "Cannot cancel rental",
        content: {
          "application/json": {
            schema: RentalErrorResponseSchema,
            examples: {
              CannotCancelWithStatus: {
                value: {
                  error: "Không thể huỷ phiên thuê đang ở trạng thái",
                  details: {
                    code: RentalErrorCodeSchema.enum.CANNOT_CANCEL_THIS_RENTAL_WITH_STATUS,
                    rentalId: "665fd6e36b7e5d53f8f3d2c9",
                    status: "HOÀN THÀNH",
                  },
                },
              },
            },
          },
        },
      },
    },
  }),

  getRentalsByUser: createRoute({
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
  }),

  getActiveRentalsByPhone: createRoute({
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
  }),

  // Card tap endpoint
  processCardTapRental: createRoute({
    method: "post",
    path: "/v1/rentals/card-rental",
    tags: ["Rentals"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: CardTapRentalRequestSchema.openapi("CardTapRentalRequest"),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Card tap rental processed",
        content: {
          "application/json": {
            schema: z
              .object({
                message: z.string(),
                mode: z.string(),
                result: RentalSchemaOpenApi,
              })
              .openapi("CardTapRentalResponse"),
          },
        },
      },
      400: {
        description: "Card tap rental failed",
        content: {
          "application/json": {
            schema: RentalErrorResponseSchema,
            examples: {
              UserNotFound: {
                value: {
                  error: "User not found for the provided card",
                  details: {
                    code: RentalErrorCodeSchema.enum.USER_NOT_FOUND_FOR_CARD,
                    cardUid: "A1B2C3D4E5F6",
                  },
                },
              },
              BikeNotFound: {
                value: {
                  error: "Bike with chip_id not found or unavailable",
                  details: {
                    code: RentalErrorCodeSchema.enum.BIKE_NOT_FOUND_FOR_CHIP,
                    chipId: "CHIP123456",
                  },
                },
              },
            },
          },
        },
      },
    },
  }),

  // Statistics and analytics endpoints
  getDashboardSummary: createRoute({
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
  }),

  getRentalSummary: createRoute({
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
  }),

  getRentalRevenue: createRoute({
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
  }),

  getStationActivity: createRoute({
    method: "get",
    path: "/v1/rentals/stats/station-activity",
    tags: ["Rentals"],
    request: {
      query: rentalDateRangeWith({
        stationId: z.string().optional(),
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
  }),
} as const;
