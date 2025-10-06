import {
  IotBookingCommandSchema,
  IotMaintenanceCommandSchema,
  IotReservationCommandSchema,
  IotStateCommandSchema,
  IotStatusCommandSchema,
  IotStatusMessageSchema,
} from "../../iot/topics";
import { z } from "../../zod";

export const DeviceIdSchema = z.string()
  .min(1, "Device identifier is required")
  .openapi("DeviceId", {
    param: {
      name: "deviceId",
      in: "path",
      required: true,
      description: "Unique device identifier (MAC address or logical id).",
    },
    example: "AABBCCDDEEFF",
  });

export const DeviceStatusSchema = z.object({
  deviceId: z.string().min(1).openapi({ example: "AABBCCDDEEFF" }),
  status: IotStatusMessageSchema.openapi("IotStatusMessage", {
    description: "Latest status message received from the device.",
    example: "available",
  }),
});

export const DeviceStatusListSchema = z.object({
  items: z.array(DeviceStatusSchema),
});

export const HealthResponseSchema = z.object({
  status: z.literal("ok").openapi("HealthStatus", { example: "ok" }),
  uptimeMs: z.number().nonnegative().openapi("ServiceUptimeMs", { example: 1234 }),
  timestamp: z.string().datetime().openapi("HealthTimestamp", { example: "2024-01-01T00:00:00.000Z" }),
});

const ValidationIssueSchema = z.object({
  path: z.string().openapi({ description: "Location of the invalid value", example: "command" }),
  message: z.string().openapi({ description: "Why the value is invalid", example: "Invalid option: expected one of \"book\"|\"claim\"|\"release\"" }),
  code: z.string().openapi({ description: "Zod issue code", example: "invalid_enum_value" }).optional(),
  expected: z.any().optional(),
  received: z.any().optional(),
});

export const ErrorDetailSchema = z.object({
  code: z.string().openapi({ description: "Application specific error code", example: "VALIDATION_ERROR" }).optional(),
  issues: z.array(ValidationIssueSchema).openapi({ description: "Detailed validation issues" }).optional(),
}).catchall(z.any());

export const ErrorResponseSchema = z.object({
  error: z.string().openapi("ErrorMessage", { example: "Invalid command payload" }),
  details: ErrorDetailSchema.openapi("ErrorDetails", {
    example: {
      code: "VALIDATION_ERROR",
      issues: [
        {
          path: "command",
          message: "Invalid option: expected one of \"book\"|\"claim\"|\"release\"",
          code: "invalid_enum_value",
          received: "bookw",
        },
      ],
    },
  }).optional(),
}).openapi("ErrorResponse", {
  description: "Standard error payload returned by the IoT service.",
  example: {
    error: "Invalid command payload",
    details: {
      code: "VALIDATION_ERROR",
      issues: [
        {
          path: "command",
          message: "Invalid option: expected one of \"book\"|\"claim\"|\"release\"",
          code: "invalid_enum_value",
          received: "bookw",
        },
      ],
    },
  },
});

export const StateCommandBodySchema = z.object({
  state: IotStateCommandSchema.openapi("IotStateCommand", { example: "available" }),
});

export const BookingCommandBodySchema = z.object({
  command: IotBookingCommandSchema.openapi("IotBookingCommand", { example: "book" }),
});

export const MaintenanceCommandBodySchema = z.object({
  command: IotMaintenanceCommandSchema.openapi("IotMaintenanceCommand", { example: "start" }),
});

export const ReservationCommandBodySchema = z.object({
  command: IotReservationCommandSchema.openapi("IotReservationCommand", { example: "reserve" }),
});

export const StatusCommandBodySchema = z.object({
  command: IotStatusCommandSchema.default("request").openapi("IotStatusCommand", { example: "request" }),
}).partial();

export const CommandAcceptedResponseSchema = z.object({
  deviceId: z.string().min(1).openapi("CommandDeviceId", { example: "AABBCCDDEEFF" }),
  topic: z.string().min(1).openapi("CommandTopic", { example: "esp/commands/status/AABBCCDDEEFF" }),
  payload: z.union([
    IotStateCommandSchema,
    IotBookingCommandSchema,
    IotMaintenanceCommandSchema,
    IotReservationCommandSchema,
    IotStatusCommandSchema,
    z.string(),
  ]).openapi("CommandPayload", { example: "request" }),
});

export type DeviceStatus = z.infer<typeof DeviceStatusSchema>;
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
export type CommandAcceptedResponse = z.infer<typeof CommandAcceptedResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type ErrorDetail = z.infer<typeof ErrorDetailSchema>;
