import { createRoute } from "@hono/zod-openapi";

import { z } from "../../../../zod";
import {
  CancelRentalRequestSchema,
  CardTapRentalRequestSchema,
  CreateRentalRequestSchema,
  EndRentalRequestSchema,
  RentalDetailSchema,
  RentalErrorCodeSchema,
  RentalErrorDetailSchema,
  RentalSchema,
  RentalWithPriceSchema,
  RentalWithPricingSchema,
  StaffCreateRentalRequestSchema,
  UpdateRentalRequestSchema,
} from "../../rentals";
import { ServerErrorResponseSchema } from "../../schemas";
import {
  createSuccessResponse,
  RentalIdParamSchema,
  SOSIdParamSchema,
} from "./shared";

const RentalErrorResponseSchema = ServerErrorResponseSchema.extend({
  details: RentalErrorDetailSchema.optional(),
}).openapi("RentalErrorResponse", {
  description: "Standard error payload for rental endpoints",
});

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

export const createRental = createRoute({
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
});

export const endMyRental = createRoute({
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
            RentalSchemaOpenApi,
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
});

export const staffCreateRental = createRoute({
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
});

export const createRentalFromSOS = createRoute({
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
});

export const updateRental = createRoute({
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
});

export const endRentalByAdmin = createRoute({
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
});

export const cancelRental = createRoute({
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
});

export const processCardTapRental = createRoute({
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
});
