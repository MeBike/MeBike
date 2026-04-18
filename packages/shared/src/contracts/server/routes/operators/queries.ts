import { createRoute } from "@hono/zod-openapi";

import {
  OperatorErrorCodeSchema,
  operatorErrorMessages,
  OperatorErrorResponseSchema,
  OperatorStationContextResponseSchema,
} from "../../operators";
import {
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from "../helpers";

export const getOperatorStationContextRoute = createRoute({
  method: "get",
  path: "/v1/operators/station-context",
  tags: ["Operators"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Current operator station plus all other stations",
      content: {
        "application/json": {
          schema: OperatorStationContextResponseSchema,
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Operator"),
    404: notFoundResponse({
      description: "Operator station not found",
      schema: OperatorErrorResponseSchema,
      example: {
        error: operatorErrorMessages.OPERATOR_STATION_NOT_FOUND,
        details: {
          code: OperatorErrorCodeSchema.enum.OPERATOR_STATION_NOT_FOUND,
        },
      },
    }),
  },
});
