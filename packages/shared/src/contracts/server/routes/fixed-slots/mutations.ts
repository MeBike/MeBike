import { createRoute } from "@hono/zod-openapi";

import {
  CreateFixedSlotTemplateRequestSchema,
  CreateFixedSlotTemplateResponseSchema,
  FixedSlotTemplateErrorCodeSchema,
  fixedSlotTemplateErrorMessages,
  FixedSlotTemplateErrorResponseSchema,
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
      description: "Overlapping fixed-slot template already exists",
      content: {
        "application/json": {
          schema: FixedSlotTemplateErrorResponseSchema,
          examples: {
            Conflict: {
              value: {
                error: fixedSlotTemplateErrorMessages.FIXED_SLOT_TEMPLATE_CONFLICT,
                details: {
                  code: FixedSlotTemplateErrorCodeSchema.enum.FIXED_SLOT_TEMPLATE_CONFLICT,
                  slotStart: "09:30",
                  slotDates: ["2026-04-20"],
                },
              },
            },
          },
        },
      },
    },
  },
});
