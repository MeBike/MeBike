import { createRoute, z } from "@hono/zod-openapi";

import {
  BookingCommandBodySchema,
  CommandAcceptedResponseSchema,
  DeviceIdSchema,
  DeviceStatusListSchema,
  DeviceStatusSchema,
  ErrorResponseSchema,
  HealthResponseSchema,
  MaintenanceCommandBodySchema,
  ReservationCommandBodySchema,
  StateCommandBodySchema,
  StatusCommandBodySchema,
} from "./schemas";

export const healthRoute = createRoute({
  method: "get",
  path: "/v1/health",
  summary: "Service heartbeat",
  description: "Check the health of the IoT service and retrieve uptime information.",
  tags: ["Health"],
  responses: {
    200: {
      description: "Service is operational.",
      content: {
        "application/json": {
          schema: HealthResponseSchema,
        },
      },
    },
  },
});

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
  },
});

export const getDeviceRoute = createRoute({
  method: "get",
  path: "/v1/devices/:deviceId",
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
  },
});

const commandResponses = {
  202: {
    description: "Command accepted for delivery.",
    content: {
      "application/json": {
        schema: CommandAcceptedResponseSchema,
      },
    },
  },
};

const commandErrorResponses = {
  400: {
    description: "Invalid command payload.",
    content: {
      "application/json": {
        schema: ErrorResponseSchema,
      },
    },
  },
};

export const sendStateCommandRoute = createRoute({
  method: "post",
  path: "/v1/devices/:deviceId/commands/state",
  summary: "Send a state command",
  description: "Change the operational state of a device.",
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

export const sendBookingCommandRoute = createRoute({
  method: "post",
  path: "/v1/devices/:deviceId/commands/booking",
  summary: "Send a booking command",
  description: "Trigger a booking workflow on the device.",
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

export const sendMaintenanceCommandRoute = createRoute({
  method: "post",
  path: "/v1/devices/:deviceId/commands/maintenance",
  summary: "Send a maintenance command",
  description: "Update the maintenance state of a device.",
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

export const sendReservationCommandRoute = createRoute({
  method: "post",
  path: "/v1/devices/:deviceId/commands/reservation",
  summary: "Send a reservation command",
  description: "Reserve or cancel reservation for a device.",
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

export const requestStatusCommandRoute = createRoute({
  method: "post",
  path: "/v1/devices/:deviceId/commands/status",
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

export const iotServiceRoutes = {
  health: healthRoute,
  listDevices: listDevicesRoute,
  getDevice: getDeviceRoute,
  sendStateCommand: sendStateCommandRoute,
  sendBookingCommand: sendBookingCommandRoute,
  sendMaintenanceCommand: sendMaintenanceCommandRoute,
  sendReservationCommand: sendReservationCommandRoute,
  requestStatusCommand: requestStatusCommandRoute,
} as const;

export type IotServiceRouteKey = keyof typeof iotServiceRoutes;
