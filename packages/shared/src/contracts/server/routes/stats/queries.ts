import { createRoute } from "@hono/zod-openapi";

import {
  StatsSummaryResponseSchema,
  ReservationForecastQuerySchema,
  ReservationForecastResponseSchema,
} from "../../stats/schemas";
import { unauthorizedResponse, forbiddenResponse } from "../helpers";

export const getStatsSummaryRoute = createRoute({
  method: "get",
  path: "/v1/stats/summary",
  tags: ["Stats"],
  responses: {
    200: {
      description: "Landing page totals summary",
      content: {
        "application/json": {
          schema: StatsSummaryResponseSchema,
        },
      },
    },
  },
});

export const getReservationForecastRoute = createRoute({
  method: "get",
  path: "/v1/stats/reservations-forecast",
  tags: ["Stats"],
  security: [{ bearerAuth: [] }],
  request: {
    query: ReservationForecastQuerySchema,
  },
  responses: {
    200: {
      description: "Forecast of upcoming reservations in the time window",
      content: {
        "application/json": {
          schema: ReservationForecastResponseSchema,
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Staff"),
  },
});

