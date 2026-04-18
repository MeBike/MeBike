import { createRoute } from "@hono/zod-openapi";

import { z } from "../../../../zod";
import {
  BikeSwapRequestErrorCodeSchema,
  BikeSwapRequestErrorResponseSchema,
  CancelRentalRequestSchema,
  CardTapRentalRequestSchema,
  CreateRentalRequestSchema,
  CreateReturnSlotRequestSchema,
  EndRentalRequestSchema,
  RentalErrorCodeSchema,
  RequestBikeSwapRequestSchema,
  ReturnSlotReservationSchema,
  StaffCreateRentalRequestSchema,
  UpdateRentalRequestSchema,
} from "../../rentals";
import { unauthorizedResponse } from "../helpers";
import {
  BikeSwapRequestDetailSchemaOpenApi,
  BikeSwapRequestSchemaOpenApi,
  createSuccessResponse,
  RentalDetailSchemaOpenApi,
  RentalErrorResponseSchema,
  RentalIdParamSchema,
  RentalSchemaOpenApi,
  RentalWithPriceSchemaOpenApi,
  SOSIdParamSchema,
} from "./shared";

export const createRental = createRoute({
  method: "post",
  path: "/v1/rentals",
  tags: ["Rentals"],
  security: [{ bearerAuth: [] }],
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
          schema: RentalWithPriceSchemaOpenApi,
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
                error: "Insufficient balance to start rental",
                details: {
                  code: RentalErrorCodeSchema.enum.NOT_ENOUGH_BALANCE_TO_RENT,
                  requiredBalance: 5000,
                  currentBalance: 2000,
                },
              },
            },
            WalletMissing: {
              value: {
                error: "User does not have a wallet",
                details: {
                  code: RentalErrorCodeSchema.enum.USER_NOT_HAVE_WALLET,
                },
              },
            },
            BikeMissingStation: {
              value: {
                error: "Bike is missing station information",
                details: {
                  code: RentalErrorCodeSchema.enum.BIKE_MISSING_STATION,
                  bikeId: "665fd6e36b7e5d53f8f3d2c9",
                },
              },
            },
          },
        },
      },
    },
    401: unauthorizedResponse(),
  },
});

export const createMyReturnSlot = createRoute({
  method: "post",
  path: "/v1/rentals/me/{rentalId}/return-slot",
  tags: ["Rentals"],
  security: [{ bearerAuth: [] }],
  request: {
    params: RentalIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: CreateReturnSlotRequestSchema.openapi("CreateReturnSlotRequest"),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Create or replace the active return slot for a rental",
      content: {
        "application/json": {
          schema: ReturnSlotReservationSchema.openapi("CreateReturnSlotResponse", {
            description: "Return slot response",
          }),
        },
      },
    },
    400: {
      description: "Cannot create return slot",
      content: {
        "application/json": {
          schema: RentalErrorResponseSchema,
        },
      },
    },
    401: unauthorizedResponse(),
    404: {
      description: "Rental or station not found",
      content: {
        "application/json": {
          schema: RentalErrorResponseSchema,
        },
      },
    },
  },
});

export const cancelMyReturnSlot = createRoute({
  method: "delete",
  path: "/v1/rentals/me/{rentalId}/return-slot",
  tags: ["Rentals"],
  security: [{ bearerAuth: [] }],
  request: {
    params: RentalIdParamSchema,
  },
  responses: {
    200: {
      description: "Cancel the active return slot for a rental",
      content: {
        "application/json": {
          schema: ReturnSlotReservationSchema.openapi("CancelReturnSlotResponse", {
            description: "Cancelled return slot response",
          }),
        },
      },
    },
    400: {
      description: "Cannot cancel return slot",
      content: {
        "application/json": {
          schema: RentalErrorResponseSchema,
        },
      },
    },
    401: unauthorizedResponse(),
    404: {
      description: "Rental or return slot not found",
      content: {
        "application/json": {
          schema: RentalErrorResponseSchema,
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
          schema: RentalWithPriceSchemaOpenApi,
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
          schema: RentalWithPriceSchemaOpenApi,
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
                error: "SOS request not found",
                details: {
                  code: RentalErrorCodeSchema.enum.SOS_NOT_FOUND,
                  sosId: "665fd6e36b7e5d53f8f3d2c9",
                },
              },
            },
            InvalidSOSStatus: {
              value: {
                error: "Cannot create rental from SOS with this status",
                details: {
                  code: RentalErrorCodeSchema.enum
                    .CANNOT_CREATE_RENTAL_WITH_SOS_STATUS,
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
          schema: RentalDetailSchemaOpenApi,
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
                error: "Cannot edit rental in this status",
                details: {
                  code: RentalErrorCodeSchema.enum
                    .CANNOT_EDIT_THIS_RENTAL_WITH_STATUS,
                  rentalId: "665fd6e36b7e5d53f8f3d2c9",
                  status: "COMPLETED",
                },
              },
            },
          },
        },
      },
    },
  },
});

export const confirmRentalReturnByOperator = createRoute({
  method: "put",
  path: "/v1/rentals/{rentalId}/end",
  tags: ["Rentals"],
  request: {
    params: RentalIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: EndRentalRequestSchema.openapi("ConfirmRentalReturnRequest"),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Rental return confirmed by staff or agency operator",
      content: {
        "application/json": {
          schema: RentalDetailSchemaOpenApi,
        },
      },
    },
    400: {
      description: "Cannot confirm rental return",
      content: {
        "application/json": {
          schema: RentalErrorResponseSchema,
        },
      },
    },
    403: {
      description: "Unauthorized access to rental",
      content: {
        "application/json": {
          schema: RentalErrorResponseSchema,
          examples: {
            Unauthorized: {
              value: {
                error: "Access denied",
                details: {
                  code: RentalErrorCodeSchema.enum.ACCESS_DENIED,
                  rentalId: "665fd6e36b7e5d53f8f3d2c9",
                  stationId: "665fd6e36b7e5d53f8f3d2c9",
                },
              },
            },
          },
        },
      },
    },
  },
});

// Legacy alias kept so existing generated route consumers do not break immediately.
export const endRentalByAdmin = confirmRentalReturnByOperator;

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
          schema: RentalDetailSchemaOpenApi,
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
                error: "Cannot cancel rental in this status",
                details: {
                  code: RentalErrorCodeSchema.enum
                    .CANNOT_CANCEL_THIS_RENTAL_WITH_STATUS,
                  rentalId: "665fd6e36b7e5d53f8f3d2c9",
                  status: "COMPLETED",
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
              rental: RentalSchemaOpenApi,
              mode: z.string(),
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
                error: "Bike not found or unavailable",
                details: {
                  code: RentalErrorCodeSchema.enum.BIKE_NOT_FOUND_FOR_CHIP,
                  bikeId: "019b17bd-d130-7e7d-be69-91ceef7b6888",
                },
              },
            },
          },
        },
      },
    },
  },
});

export const requestBikeSwap = createRoute({
  method: "post",
  path: "/v1/rentals/{rentalId}/request-bike-swap",
  security: [{ bearerAuth: [] }],
  tags: ["Bike Swap"],
  request: {
    params: RentalIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: RequestBikeSwapRequestSchema.openapi(
            "RequestBikeSwapRequest",
          ),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Bike swap requested successfully",
      content: {
        "application/json": {
          schema: createSuccessResponse(
            BikeSwapRequestSchemaOpenApi,
            "Request bike swap response",
          ),
        },
      },
    },
    400: {
      description: "Cannot request bike swap",
      content: {
        "application/json": {
          schema: RentalErrorResponseSchema,
          examples: {
            CannotRequestSwapWithStatus: {
              value: {
                error: "Cannot request bike swap in this status",
                details: {
                  code: RentalErrorCodeSchema.enum
                    .CANNOT_REQUEST_SWAP_THIS_RENTAL_WITH_STATUS,
                  rentalId: "665fd6e36b7e5d53f8f3d2c9",
                  status: "COMPLETED",
                },
              },
            },
            BikeSwapRequestAlreadyPending: {
              value: {
                error: "Bike swap request already pending",
                details: {
                  code: RentalErrorCodeSchema.enum
                    .BIKE_SWAP_REQUEST_ALREADY_PENDING,
                },
              },
            },

          },
        },
      },
    },
    403: {
      description: "Unauthorized access to rental",
      content: {
        "application/json": {
          schema: RentalErrorResponseSchema,
          examples: {
            Unauthorized: {
              value: {
                error: "Access denied",
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
    404: {
      description: "Rental not found",
      content: {
        "application/json": {
          schema: RentalErrorResponseSchema,
          examples: {
            RentalNotFound: {
              value: {
                error: "Rental not found",
                details: {
                  code: RentalErrorCodeSchema.enum.RENTAL_NOT_FOUND,
                  rentalId: "665fd6e36b7e5d53f8f3d2c9",
                },
              },
            },
            StationNotFound: {
              value: {
                error: "Station not found",
                details: {
                  code: RentalErrorCodeSchema.enum.STATION_NOT_FOUND,
                  stationId: "665fd6e36b7e5d53f8f3d2c9",
                },
              },
            },
          },
        },
      },
    },
    401: {
      description: "Unauthorized access to rental",
      content: {
        "application/json": {
          schema: RentalErrorResponseSchema,
          examples: {
            RentalNotFound: {
              value: {
                error: "Rental not found",
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

export const operatorApproveBikeSwapRequest = createRoute({
  method: "post",
  path: "/v1/operators/bike-swap-requests/{bikeSwapRequestId}/approve",
  security: [{ bearerAuth: [] }],
  tags: ["Bike Swap"],
  request: {
    params: z.object({
      bikeSwapRequestId: z.uuidv7(),
    }),
  },
  responses: {
    200: {
      description: "Bike swap approved successfully",
      content: {
        "application/json": {
          schema: createSuccessResponse(
            BikeSwapRequestDetailSchemaOpenApi,
            "Approve bike swap response",
          ),
        },
      },
    },
    400: {
      description: "Cannot approve bike swap",
      content: {
        "application/json": {
          schema: BikeSwapRequestErrorResponseSchema,
          examples: {
            CannotApproveSwapWithStatus: {
              value: {
                error: "Invalid bike swap request status",
                details: {
                  code: BikeSwapRequestErrorCodeSchema.enum
                    .INVALID_BIKE_SWAP_REQUEST_STATUS,
                  currentStatus: "CONFIRMED",
                },
              },
            },
            NoAvailableBike: {
              value: {
                error: "No available bike found for swap",
                details: {
                  code: BikeSwapRequestErrorCodeSchema.enum.NO_AVAILABLE_BIKE,
                },
              },
            },
          },
        },
      },
    },
    404: {
      description: "Bike swap request not found",
      content: {
        "application/json": {
          schema: BikeSwapRequestErrorResponseSchema,
          examples: {
            BikeSwapRequestNotFound: {
              value: {
                error: "Bike swap request not found",
                details: {
                  code: BikeSwapRequestErrorCodeSchema.enum
                    .BIKE_SWAP_REQUEST_NOT_FOUND,
                  bikeSwapRequestId: "665fd6e36b7e5d53f8f3d2c9",
                },
              },
            },
          },
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: BikeSwapRequestErrorResponseSchema,
        },
      },
    },
  },
});

export const approveBikeSwapRequest = operatorApproveBikeSwapRequest;
export const agencyApproveBikeSwapRequest = operatorApproveBikeSwapRequest;

export const operatorRejectBikeSwapRequest = createRoute({
  method: "post",
  path: "/v1/operators/bike-swap-requests/{bikeSwapRequestId}/reject",
  security: [{ bearerAuth: [] }],
  tags: ["Bike Swap"],
  request: {
    params: z.object({
      bikeSwapRequestId: z.uuidv7(),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            reason: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Bike swap rejected successfully",
      content: {
        "application/json": {
          schema: createSuccessResponse(
            BikeSwapRequestDetailSchemaOpenApi,
            "Reject bike swap response",
          ),
        },
      },
    },
    400: {
      description: "Cannot reject bike swap",
      content: {
        "application/json": {
          schema: BikeSwapRequestErrorResponseSchema,
          examples: {
            CannotRejectSwapWithStatus: {
              value: {
                error: "Invalid bike swap request status",
                details: {
                  code: BikeSwapRequestErrorCodeSchema.enum
                    .INVALID_BIKE_SWAP_REQUEST_STATUS,
                  currentStatus: "REJECTED",
                },
              },
            },
          },
        },
      },
    },
    404: {
      description: "Bike swap request not found",
      content: {
        "application/json": {
          schema: BikeSwapRequestErrorResponseSchema,
          examples: {
            BikeSwapRequestNotFound: {
              value: {
                error: "Bike swap request not found",
                details: {
                  code: BikeSwapRequestErrorCodeSchema.enum
                    .BIKE_SWAP_REQUEST_NOT_FOUND,
                  bikeSwapRequestId: "665fd6e36b7e5d53f8f3d2c9",
                },
              },
            },
          },
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: BikeSwapRequestErrorResponseSchema,
        },
      },
    },
  },
});

export const rejectBikeSwapRequest = operatorRejectBikeSwapRequest;
export const agencyRejectBikeSwapRequest = operatorRejectBikeSwapRequest;
