import { createRoute } from "@hono/zod-openapi";

import { DeviceStatusListSchema } from "../../schemas";
import { deviceErrorResponses } from "./shared";

export const listDevicesRoute = createRoute({
  method: "get",
  path: "/v1/devices",
  summary: "List devices",
  description: "Return the current status of all devices tracked by the service.",
  tags: ["Devices"],
  responses: {
    200: {
      description: "List of devices and their latest known status.",
      content: {
        "application/json": {
          schema: DeviceStatusListSchema,
        },
      },
    },
    ...deviceErrorResponses,
  },
});
