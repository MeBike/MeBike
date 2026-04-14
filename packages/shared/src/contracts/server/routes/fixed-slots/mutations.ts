import { createRoute } from "@hono/zod-openapi";

import { z } from "../../../../zod";
import {
  CreateFixedSlotTemplateRequestSchema,
  CreateFixedSlotTemplateResponseSchema,
  FixedSlotTemplateErrorCodeSchema,
  fixedSlotTemplateErrorMessages,
  FixedSlotTemplateErrorResponseSchema,
  FixedSlotTemplateSchema,
} from "../../fixed-slots/schemas";
import { unauthorizedResponse } from "../helpers";

export const createFixedSlotTemplateRoute = createRoute({
  method: "post",
  path: "/v1/fixed-slot-templates",
  tags: ["Fixed Slot Templates"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateFixedSlotTemplateRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Create fixed-slot template",
      content: {
        "application/json": {
          schema: CreateFixedSlotTemplateResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid fixed-slot template request",
      content: {
        "application/json": {
          schema: FixedSlotTemplateErrorResponseSchema,
          examples: {
            DateNotFuture: {
              value: {
                error: fixedSlotTemplateErrorMessages.FIXED_SLOT_DATE_NOT_FUTURE,
                details: {
                  code: FixedSlotTemplateErrorCodeSchema.enum.FIXED_SLOT_DATE_NOT_FUTURE,
                  slotDate: "2026-04-10",
                },
              },
            },
            InsufficientBalance: {
              value: {
                error: fixedSlotTemplateErrorMessages.FIXED_SLOT_INSUFFICIENT_BALANCE,
                details: {
                  code: FixedSlotTemplateErrorCodeSchema.enum.FIXED_SLOT_INSUFFICIENT_BALANCE,
                  requiredAmount: "4000",
                },
              },
            },
          },
        },
      },
    },
    401: unauthorizedResponse(),
    404: {
      description: "Station not found",
      content: {
        "application/json": {
          schema: FixedSlotTemplateErrorResponseSchema,
          examples: {
            StationNotFound: {
              value: {
                error: fixedSlotTemplateErrorMessages.FIXED_SLOT_STATION_NOT_FOUND,
                details: {
                  code: FixedSlotTemplateErrorCodeSchema.enum.FIXED_SLOT_STATION_NOT_FOUND,
                  stationId: "0195c1ca-a955-7b35-b2ea-6f2f5763d6b7",
                },
              },
            },
          },
        },
      },
    },
    409: {
      description: "Fixed-slot conflict or billing race",
      content: {
        "application/json": {
          schema: FixedSlotTemplateErrorResponseSchema,
          examples: {
            TemplateConflict: {
              value: {
                error: fixedSlotTemplateErrorMessages.FIXED_SLOT_TEMPLATE_CONFLICT,
                details: {
                  code: FixedSlotTemplateErrorCodeSchema.enum.FIXED_SLOT_TEMPLATE_CONFLICT,
                  slotStart: "09:30",
                  slotDates: ["2026-04-20"],
                },
              },
            },
            BillingConflict: {
              value: {
                error: fixedSlotTemplateErrorMessages.FIXED_SLOT_BILLING_CONFLICT,
                details: {
                  code: FixedSlotTemplateErrorCodeSchema.enum.FIXED_SLOT_BILLING_CONFLICT,
                },
              },
            },
          },
        },
      },
    },
  },
});

export const cancelFixedSlotTemplateRoute = createRoute({
  method: "post",
  path: "/v1/fixed-slot-templates/{id}/cancel",
  tags: ["Fixed Slot Templates"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.uuidv7(),
    }),
  },
  responses: {
    200: {
      description: "Cancel fixed-slot template",
      content: {
        "application/json": {
          schema: FixedSlotTemplateSchema,
        },
      },
    },
    401: unauthorizedResponse(),
    404: {
      description: "Fixed-slot template not found",
      content: {
        "application/json": {
          schema: FixedSlotTemplateErrorResponseSchema,
          examples: {
            NotFound: {
              value: {
                error: fixedSlotTemplateErrorMessages.FIXED_SLOT_TEMPLATE_NOT_FOUND,
                details: {
                  code: FixedSlotTemplateErrorCodeSchema.enum.FIXED_SLOT_TEMPLATE_NOT_FOUND,
                },
              },
            },
          },
        },
      },
    },
    409: {
      description: "Fixed-slot template cancel conflict",
      content: {
        "application/json": {
          schema: FixedSlotTemplateErrorResponseSchema,
          examples: {
            Conflict: {
              value: {
                error: fixedSlotTemplateErrorMessages.FIXED_SLOT_TEMPLATE_CANCEL_CONFLICT,
                details: {
                  code: FixedSlotTemplateErrorCodeSchema.enum.FIXED_SLOT_TEMPLATE_CANCEL_CONFLICT,
                },
              },
            },
          },
        },
      },
    },
  },
});
