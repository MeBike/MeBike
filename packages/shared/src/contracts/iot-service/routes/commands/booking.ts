import { createRoute, z } from "@hono/zod-openapi";

import {
  BookingCommandBodySchema,
  DeviceIdSchema,
} from "../../schemas";
import { commandErrorResponses, commandResponses } from "./shared";

export const sendBookingCommandRoute = createRoute({
  method: "post",
  path: "/v1/devices/{deviceId}/commands/booking",
  summary: "Send a booking command",
  description:
    "**User-facing booking workflow.** "
    + "Commands: `book` (start using bike), `claim` (activate reservation), `release` (finish ride). "
    + "Includes business logic and additional status publishing beyond simple state changes.",
  tags: ["Commands"],
  request: {
    params: z.object({
      deviceId: DeviceIdSchema,
    }),
    body: {
      content: {
        "application/json": {
          schema: BookingCommandBodySchema,
        },
      },
    },
  },
  responses: {
    ...commandResponses,
    ...commandErrorResponses,
  },
});
