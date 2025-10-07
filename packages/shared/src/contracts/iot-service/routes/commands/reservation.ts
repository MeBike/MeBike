import { createRoute, z } from "@hono/zod-openapi";

import {
  DeviceIdSchema,
  ReservationCommandBodySchema,
} from "../../schemas";
import { commandErrorResponses, commandResponses } from "./shared";

export const sendReservationCommandRoute = createRoute({
  method: "post",
  path: "/v1/devices/:deviceId/commands/reservation",
  summary: "Send a reservation command",
  description:
    "**Reservation workflow.** "
    + "Commands: `reserve` (hold bike for 5-15 min), `cancel` (cancel before claiming). "
    + "Typically used before booking when user wants to ensure bike availability.",
  tags: ["Commands"],
  request: {
    params: z.object({
      deviceId: DeviceIdSchema,
    }),
    body: {
      content: {
        "application/json": {
          schema: ReservationCommandBodySchema,
        },
      },
    },
  },
  responses: {
    ...commandResponses,
    ...commandErrorResponses,
  },
});
