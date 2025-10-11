import { createRoute, z } from "@hono/zod-openapi";

import {
  DeviceIdSchema,
  DeviceStatusSchema,
  ErrorResponseSchema,
} from "../../schemas";
import { deviceErrorResponses } from "./shared";

export const getDeviceRoute = createRoute({
  method: "get",
  path: "/v1/devices/{deviceId}",
  summary: "Get a device status",
  description: "Return the latest known status for a specific device.",
  tags: ["Devices"],
  request: {
    params: z.object({
      deviceId: DeviceIdSchema,
    }),
  },
  responses: {
    200: {
      description: "Device status returned successfully.",
      content: {
        "application/json": {
          schema: DeviceStatusSchema,
        },
      },
    },
    400: {
      description: "Invalid device identifier provided.",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: "Device not found.",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    ...deviceErrorResponses,
  },
});
