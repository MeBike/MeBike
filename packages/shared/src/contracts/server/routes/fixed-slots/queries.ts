import { createRoute } from "@hono/zod-openapi";

import { z } from "../../../../zod";
import { ListFixedSlotTemplatesQuerySchema } from "../../fixed-slots";
import {
  FixedSlotTemplateErrorCodeSchema,
  fixedSlotTemplateErrorMessages,
  FixedSlotTemplateErrorResponseSchema,
  FixedSlotTemplateSchema,
  ListFixedSlotTemplatesResponseSchema,
} from "../../fixed-slots/schemas";
import { unauthorizedResponse } from "../helpers";

/** Khai báo contract cho route lấy danh sách fixed-slot template của user hiện tại. */
export const listFixedSlotTemplatesRoute = createRoute({
  method: "get",
  path: "/v1/fixed-slot-templates",
  tags: ["Fixed Slot Templates"],
  security: [{ bearerAuth: [] }],
  request: {
    query: ListFixedSlotTemplatesQuerySchema,
  },
  responses: {
    200: {
      description: "List current user's fixed-slot templates",
      content: {
        "application/json": {
          schema: ListFixedSlotTemplatesResponseSchema,
        },
      },
    },
    401: unauthorizedResponse(),
  },
});

/** Khai báo contract cho route lấy chi tiết một fixed-slot template của user hiện tại. */
export const getFixedSlotTemplateRoute = createRoute({
  method: "get",
  path: "/v1/fixed-slot-templates/{id}",
  tags: ["Fixed Slot Templates"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.uuidv7(),
    }),
  },
  responses: {
    200: {
      description: "Get current user's fixed-slot template",
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
  },
});
