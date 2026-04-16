import { createRoute } from "@hono/zod-openapi";

import {
  ListCouponsQuerySchema,
  ListCouponsResponseSchema,
} from "../../coupons/schemas";
import {
  forbiddenResponse,
  unauthorizedResponse,
} from "../helpers";

export const listCouponsRoute = createRoute({
  method: "get",
  path: "/v1/coupons",
  tags: ["Coupons"],
  security: [{ bearerAuth: [] }],
  request: {
    query: ListCouponsQuerySchema,
  },
  responses: {
    200: {
      description: "Current user's coupons",
      content: {
        "application/json": {
          schema: ListCouponsResponseSchema,
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("User"),
  },
});
