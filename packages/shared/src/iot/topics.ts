import { z } from "zod";

const COMMAND_ROOT = "esp/commands" as const;
const STATUS_ROOT = "esp/status" as const;
const LOG_ROOT = "esp/logs" as const;
const BOOKING_STATUS_TOPIC = "esp/booking/status" as const;
const MAINTENANCE_STATUS_TOPIC = "esp/maintenance/status" as const;

export const IOT_COMMAND_TOPICS = {
  root: COMMAND_ROOT,
  state: `${COMMAND_ROOT}/state` as const,
  booking: `${COMMAND_ROOT}/booking` as const,
  maintenance: `${COMMAND_ROOT}/maintenance` as const,
  status: `${COMMAND_ROOT}/status` as const,
} as const;

export const IOT_PUBLISH_TOPICS = {
  status: STATUS_ROOT,
  logs: LOG_ROOT,
  bookingStatus: BOOKING_STATUS_TOPIC,
  maintenanceStatus: MAINTENANCE_STATUS_TOPIC,
} as const;

export type IotCommandTopic
  = typeof IOT_COMMAND_TOPICS[keyof typeof IOT_COMMAND_TOPICS];

export type IotPublishTopic
  = typeof IOT_PUBLISH_TOPICS[keyof typeof IOT_PUBLISH_TOPICS];

export const IOT_STATE_LABELS = [
  "available",
  "booked",
  "maintained",
  "unavailable",
] as const;

export type IotStateLabel = (typeof IOT_STATE_LABELS)[number];

export const IotStateCommandSchema = z.enum(IOT_STATE_LABELS);
export type IotStateCommand = z.infer<typeof IotStateCommandSchema>;

export const IOT_BOOKING_COMMANDS = ["book", "release"] as const;
export const IotBookingCommandSchema = z.enum(IOT_BOOKING_COMMANDS);
export type IotBookingCommand = z.infer<typeof IotBookingCommandSchema>;

export const IOT_MAINTENANCE_COMMANDS = ["start", "complete"] as const;
export const IotMaintenanceCommandSchema = z.enum(IOT_MAINTENANCE_COMMANDS);
export type IotMaintenanceCommand = z.infer<typeof IotMaintenanceCommandSchema>;

export const IOT_STATUS_COMMANDS = ["request"] as const;
export const IotStatusCommandSchema = z.enum(IOT_STATUS_COMMANDS);
export type IotStatusCommand = z.infer<typeof IotStatusCommandSchema>;

export const IotStatusMessageSchema = z.union([
  z.enum(["ESP32 online"]),
  z.enum(IOT_STATE_LABELS),
  z.string().regex(/^State changed to \d+$/),
  z.string().regex(/^Current state: \d+$/),
]);
export type IotStatusMessage = z.infer<typeof IotStatusMessageSchema>;

export const IotBookingStatusMessageSchema = z.enum(["booked", "available"]);
export type IotBookingStatusMessage = z.infer<
  typeof IotBookingStatusMessageSchema
>;

export const IotMaintenanceStatusMessageSchema = z.enum([
  "in_progress",
  "completed",
]);
export type IotMaintenanceStatusMessage = z.infer<
  typeof IotMaintenanceStatusMessageSchema
>;

export type IotCommandPayloadByTopic = {
  [IOT_COMMAND_TOPICS.root]: IotStateCommand;
  [IOT_COMMAND_TOPICS.state]: IotStateCommand;
  [IOT_COMMAND_TOPICS.booking]: IotBookingCommand;
  [IOT_COMMAND_TOPICS.maintenance]: IotMaintenanceCommand;
  [IOT_COMMAND_TOPICS.status]: IotStatusCommand;
};

export type IotPublishPayloadByTopic = {
  [IOT_PUBLISH_TOPICS.status]: IotStatusMessage;
  [IOT_PUBLISH_TOPICS.logs]: string;
  [IOT_PUBLISH_TOPICS.bookingStatus]: IotBookingStatusMessage;
  [IOT_PUBLISH_TOPICS.maintenanceStatus]: IotMaintenanceStatusMessage;
};

const MAC_SANITISE_REGEX = /[^A-F0-9]/gi;

export function topicWithMac<T extends string>(baseTopic: T, rawMac?: string | null): T | `${T}/${string}` {
  if (!rawMac) {
    return baseTopic;
  }

  const mac = rawMac.replace(MAC_SANITISE_REGEX, "").toUpperCase();
  if (!mac) {
    return baseTopic;
  }

  const strippedBase = baseTopic.endsWith("/")
    ? (baseTopic.slice(0, -1) as T)
    : baseTopic;

  return `${strippedBase}/${mac}` as const;
}

export const IotDeviceStateSchema = z.enum([
  "STATE_INIT",
  "STATE_CONNECTING_WIFI",
  "STATE_CONNECTED",
  "STATE_ERROR",
  "STATE_AVAILABLE",
  "STATE_BOOKED",
  "STATE_MAINTAINED",
  "STATE_UNAVAILABLE",
]);

export type IotDeviceState = z.infer<typeof IotDeviceStateSchema>;

export const DEVICE_STATE_TO_STATUS: Record<IotDeviceState, IotStateLabel> = {
  STATE_INIT: "unavailable",
  STATE_CONNECTING_WIFI: "unavailable",
  STATE_CONNECTED: "available",
  STATE_ERROR: "unavailable",
  STATE_AVAILABLE: "available",
  STATE_BOOKED: "booked",
  STATE_MAINTAINED: "maintained",
  STATE_UNAVAILABLE: "unavailable",
};

export const IOT_DEVICE_STATE_ORDER = [
  "STATE_INIT",
  "STATE_CONNECTING_WIFI",
  "STATE_CONNECTED",
  "STATE_ERROR",
  "STATE_AVAILABLE",
  "STATE_BOOKED",
  "STATE_MAINTAINED",
  "STATE_UNAVAILABLE",
] as const satisfies ReadonlyArray<IotDeviceState>;

export const DEVICE_STATE_INDEX_TO_STATUS = IOT_DEVICE_STATE_ORDER.map(
  state => DEVICE_STATE_TO_STATUS[state],
);

export function stateIndexToLabel(index: number): IotStateLabel | null {
  const stateKey = IOT_DEVICE_STATE_ORDER[index];
  return stateKey ? DEVICE_STATE_TO_STATUS[stateKey] : null;
}
