import { createRoute } from "@hono/zod-openapi";

import { z } from "../../../../zod";
import {
  CreateFixedSlotTemplateRequestSchema,
  CreateFixedSlotTemplateResponseSchema,
  FixedSlotDateStringSchema,
  FixedSlotTemplateErrorCodeSchema,
  fixedSlotTemplateErrorMessages,
  FixedSlotTemplateErrorResponseSchema,
  FixedSlotTemplateSchema,
  UpdateFixedSlotTemplateRequestSchema,
  UpdateFixedSlotTemplateResponseSchema,
} from "../../fixed-slots/schemas";
import { unauthorizedResponse } from "../helpers";

/** Khai báo contract cho route tạo fixed-slot template. */
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

/** Khai báo contract cho route hủy toàn bộ fixed-slot template. */
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

/** Khai báo contract cho route cập nhật fixed-slot template. */
export const updateFixedSlotTemplateRoute = createRoute({
  method: "patch",
  path: "/v1/fixed-slot-templates/{id}",
  tags: ["Fixed Slot Templates"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.uuidv7(),
    }),
    body: {
      content: {
        "application/json": {
          schema: UpdateFixedSlotTemplateRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Update fixed-slot template",
      content: {
        "application/json": {
          schema: UpdateFixedSlotTemplateResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid fixed-slot template update",
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
      description: "Fixed-slot template or date not found",
      content: {
        "application/json": {
          schema: FixedSlotTemplateErrorResponseSchema,
          examples: {
            TemplateNotFound: {
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
      description: "Fixed-slot update conflict",
      content: {
        "application/json": {
          schema: FixedSlotTemplateErrorResponseSchema,
          examples: {
            DateLocked: {
              value: {
                error: fixedSlotTemplateErrorMessages.FIXED_SLOT_DATE_LOCKED,
                details: {
                  code: FixedSlotTemplateErrorCodeSchema.enum.FIXED_SLOT_DATE_LOCKED,
                  slotDate: "2026-04-20",
                },
              },
            },
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
            UpdateConflict: {
              value: {
                error: fixedSlotTemplateErrorMessages.FIXED_SLOT_TEMPLATE_UPDATE_CONFLICT,
                details: {
                  code: FixedSlotTemplateErrorCodeSchema.enum.FIXED_SLOT_TEMPLATE_UPDATE_CONFLICT,
                },
              },
            },
          },
        },
      },
    },
  },
});

/** Khai báo contract cho route xóa một ngày khỏi fixed-slot template. */
export const removeFixedSlotTemplateDateRoute = createRoute({
  method: "delete",
  path: "/v1/fixed-slot-templates/{id}/dates/{slotDate}",
  tags: ["Fixed Slot Templates"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.uuidv7(),
      slotDate: FixedSlotDateStringSchema,
    }),
  },
  responses: {
    200: {
      description: "Remove one fixed-slot date",
      content: {
        "application/json": {
          schema: FixedSlotTemplateSchema,
        },
      },
    },
    401: unauthorizedResponse(),
    404: {
      description: "Fixed-slot template or date not found",
      content: {
        "application/json": {
          schema: FixedSlotTemplateErrorResponseSchema,
          examples: {
            DateNotFound: {
              value: {
                error: fixedSlotTemplateErrorMessages.FIXED_SLOT_DATE_NOT_FOUND,
                details: {
                  code: FixedSlotTemplateErrorCodeSchema.enum.FIXED_SLOT_DATE_NOT_FOUND,
                  slotDate: "2026-04-20",
                },
              },
            },
          },
        },
      },
    },
    409: {
      description: "Fixed-slot remove conflict",
      content: {
        "application/json": {
          schema: FixedSlotTemplateErrorResponseSchema,
          examples: {
            DateLocked: {
              value: {
                error: fixedSlotTemplateErrorMessages.FIXED_SLOT_DATE_LOCKED,
                details: {
                  code: FixedSlotTemplateErrorCodeSchema.enum.FIXED_SLOT_DATE_LOCKED,
                  slotDate: "2026-04-20",
                },
              },
            },
            UpdateConflict: {
              value: {
                error: fixedSlotTemplateErrorMessages.FIXED_SLOT_TEMPLATE_UPDATE_CONFLICT,
                details: {
                  code: FixedSlotTemplateErrorCodeSchema.enum.FIXED_SLOT_TEMPLATE_UPDATE_CONFLICT,
                },
              },
            },
          },
        },
      },
    },
  },
});
