import { z } from "../zod";

/**
 * Quy ước hiện tại: danh tính MQTT của thiết bị trùng với `Bike.id`.
 * Tên trường vẫn giữ là `deviceId` để ổn định contract transport.
 */
// Current convention: MQTT device identity equals Bike.id.
export const DEVICE_TOPIC_ROOT = "device" as const;

/**
 * Các pattern topic MQTT mà worker server sẽ subscribe.
 */
export const DEVICE_TOPIC_PATTERNS = {
  tapEvents: `${DEVICE_TOPIC_ROOT}/+/events/tap` as const,
  commands: `${DEVICE_TOPIC_ROOT}/+/commands` as const,
  acknowledgements: `${DEVICE_TOPIC_ROOT}/+/acks` as const,
  status: `${DEVICE_TOPIC_ROOT}/+/status` as const,
} as const;

/**
 * Tạo topic publish sự kiện quẹt thẻ từ thiết bị lên server.
 */
export function deviceTapEventTopic(deviceId: string) {
  return `${DEVICE_TOPIC_ROOT}/${deviceId}/events/tap` as const;
}

/**
 * Tạo topic server gửi lệnh điều khiển xuống thiết bị.
 */
export function deviceCommandTopic(deviceId: string) {
  return `${DEVICE_TOPIC_ROOT}/${deviceId}/commands` as const;
}

/**
 * Tạo topic thiết bị phản hồi kết quả xử lý lệnh.
 */
export function deviceAcknowledgementTopic(deviceId: string) {
  return `${DEVICE_TOPIC_ROOT}/${deviceId}/acks` as const;
}

/**
 * Tạo topic thiết bị báo trạng thái runtime hiện tại.
 */
export function deviceStatusTopic(deviceId: string) {
  return `${DEVICE_TOPIC_ROOT}/${deviceId}/status` as const;
}

/**
 * Trạng thái runtime tối giản của firmware thiết bị.
 */
export const DeviceRuntimeStateSchema = z.enum([
  "BOOTING",
  "OFFLINE",
  "READY",
  "PROCESSING_TAP",
  "EXECUTING_COMMAND",
  "ERROR",
]);

/**
 * Tập lệnh server hiện được phép gửi xuống thiết bị.
 */
export const DeviceCommandActionSchema = z.enum([
  "unlock",
  "deny",
  "ping",
]);

/**
 * Payload sự kiện quẹt thẻ từ thiết bị.
 */
export const DeviceTapEventSchema = z.object({
  requestId: z.string().min(1),
  deviceId: z.string().min(1).describe("Current convention: Bike.id"),
  cardUid: z.string().min(1),
  timestampMs: z.number().int().nonnegative(),
});

/**
 * Payload lệnh server gửi xuống thiết bị.
 */
export const DeviceCommandSchema = z.object({
  requestId: z.string().min(1),
  action: DeviceCommandActionSchema,
  reason: z.string().min(1).optional(),
  durationMs: z.number().int().positive().optional(),
});

/**
 * Trạng thái phản hồi của thiết bị sau khi nhận lệnh.
 */
export const DeviceAcknowledgementStatusSchema = z.enum([
  "done",
  "rejected",
]);

/**
 * Payload phản hồi từ thiết bị sau khi xử lý lệnh.
 */
export const DeviceAcknowledgementSchema = z.object({
  deviceId: z.string().min(1).describe("Current convention: Bike.id"),
  requestId: z.string(),
  action: z.string().min(1),
  status: DeviceAcknowledgementStatusSchema,
  detail: z.string().min(1).optional(),
});

/**
 * Payload heartbeat/trạng thái runtime của thiết bị.
 */
export const DeviceRuntimeStatusSchema = z.object({
  deviceId: z.string().min(1).describe("Current convention: Bike.id"),
  runtimeState: DeviceRuntimeStateSchema,
  wifiConnected: z.boolean(),
  mqttConnected: z.boolean(),
  nfcHealthy: z.boolean(),
  timestampMs: z.number().int().nonnegative(),
});

/** Kiểu runtime state của thiết bị sau khi parse contract. */
export type DeviceRuntimeState = z.infer<typeof DeviceRuntimeStateSchema>;
/** Kiểu action command server được phép gửi. */
export type DeviceCommandAction = z.infer<typeof DeviceCommandActionSchema>;
/** Kiểu tap event chuẩn hóa dùng chung giữa firmware và server. */
export type DeviceTapEvent = z.infer<typeof DeviceTapEventSchema>;
/** Kiểu command chuẩn hóa dùng chung giữa server và firmware. */
export type DeviceCommand = z.infer<typeof DeviceCommandSchema>;
/** Kiểu ack chuẩn hóa từ firmware gửi về server. */
export type DeviceAcknowledgement = z.infer<typeof DeviceAcknowledgementSchema>;
/** Kiểu status ack từ firmware. */
export type DeviceAcknowledgementStatus = z.infer<typeof DeviceAcknowledgementStatusSchema>;
/** Kiểu runtime status chuẩn hóa của firmware. */
export type DeviceRuntimeStatus = z.infer<typeof DeviceRuntimeStatusSchema>;
