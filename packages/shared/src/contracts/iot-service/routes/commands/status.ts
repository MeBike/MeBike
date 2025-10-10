import { createRoute, z } from "@hono/zod-openapi";

import {
  DeviceIdSchema,
  StatusCommandBodySchema,
} from "../../schemas";
import { commandErrorResponses, commandResponses } from "./shared";

export const requestStatusCommandRoute = createRoute({
  method: "post",
  path: "/v1/devices/{deviceId}/commands/status",
  summary: "Request a status update",
  description: "Ask a device to publish its current status to MQTT.",
  tags: ["Commands"],
  request: {
    params: z.object({
      deviceId: DeviceIdSchema,
    }),
    body: {
      content: {
        "application/json": {
          schema: StatusCommandBodySchema,
        },
      },
      required: false,
    },
  },
  responses: {
    ...commandResponses,
    ...commandErrorResponses,
  },
});
