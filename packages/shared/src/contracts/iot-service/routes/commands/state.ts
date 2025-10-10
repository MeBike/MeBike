import { createRoute, z } from "@hono/zod-openapi";

import {
  DeviceIdSchema,
  StateCommandBodySchema,
} from "../../schemas";
import { commandErrorResponses, commandResponses } from "./shared";

export const sendStateCommandRoute = createRoute({
  method: "post",
  path: "/v1/devices/{deviceId}/commands/state",
  summary: "Send a state command",
  description:
    "**Low-level state manipulation** for administrative purposes. "
    + "Directly changes device state if transition is allowed by the state machine. "
    + "Use workflow commands (booking, reservation, maintenance) for user-facing operations. "
    + "Available states: available, reserved, booked, broken, maintained, unavailable.",
  tags: ["Commands"],
  request: {
    params: z.object({
      deviceId: DeviceIdSchema,
    }),
    body: {
      content: {
        "application/json": {
          schema: StateCommandBodySchema,
        },
      },
    },
  },
  responses: {
    ...commandResponses,
    ...commandErrorResponses,
  },
});
