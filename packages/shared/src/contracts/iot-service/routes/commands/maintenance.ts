import { createRoute, z } from "@hono/zod-openapi";

import {
  DeviceIdSchema,
  MaintenanceCommandBodySchema,
} from "../../schemas";
import { commandErrorResponses, commandResponses } from "./shared";

export const sendMaintenanceCommandRoute = createRoute({
  method: "post",
  path: "/v1/devices/:deviceId/commands/maintenance",
  summary: "Send a maintenance command",
  description:
    "**Maintenance workflow.** "
    + "Commands: `start` (begin maintenance), `complete` (return to service). "
    + "Typically used by admins or automated systems to mark devices for servicing.",
  tags: ["Commands"],
  request: {
    params: z.object({
      deviceId: DeviceIdSchema,
    }),
    body: {
      content: {
        "application/json": {
          schema: MaintenanceCommandBodySchema,
        },
      },
    },
  },
  responses: {
    ...commandResponses,
    ...commandErrorResponses,
  },
});
