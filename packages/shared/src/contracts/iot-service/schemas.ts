import {
  IotBookingCommandSchema,
  IotMaintenanceCommandSchema,
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

export const ErrorResponseSchema = z.object({
  error: z.string().openapi("ErrorMessage", { example: "Device not found" }),
  details: z.record(z.string(), z.any()).optional(),
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
    IotStatusCommandSchema,
    z.string(),
  ]).openapi("CommandPayload", { example: "request" }),
});

export type DeviceStatus = z.infer<typeof DeviceStatusSchema>;
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
export type CommandAcceptedResponse = z.infer<typeof CommandAcceptedResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
