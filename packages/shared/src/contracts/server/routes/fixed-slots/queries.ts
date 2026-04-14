import { createRoute } from "@hono/zod-openapi";

import { ListFixedSlotTemplatesQuerySchema } from "../../fixed-slots";
import {
  ListFixedSlotTemplatesResponseSchema,
} from "../../fixed-slots/schemas";
import { unauthorizedResponse } from "../helpers";

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
