import type { Buffer } from "node:buffer";

import {
  DeviceAcknowledgementSchema,
  DeviceRuntimeStatusSchema,
  DeviceTapEventSchema,
} from "@mebike/shared";

import logger from "@/lib/logger";

import type { IncomingDeviceRuntimeMessage } from "./types";

/**
 * Phân loại topic MQTT thành loại thông điệp mà runtime IoT hiểu được.
 *
 * Topic không thuộc nhóm device runtime sẽ trả về `null` để caller bỏ qua. Hàm
 * này chỉ kiểm tra cấu trúc topic, không parse hoặc validate payload.
 *
 * @param topic Topic MQTT nhận từ broker.
 * @returns Loại thông điệp nội bộ, hoặc `null` nếu topic không thuộc runtime này.
 */
export function resolveDeviceRuntimeTopicKind(topic: string): "tap" | "status" | "ack" | null {
  if (/^device\/[^/]+\/events\/tap$/.test(topic)) {
    return "tap";
  }

  if (/^device\/[^/]+\/status$/.test(topic)) {
    return "status";
  }

  if (/^device\/[^/]+\/acks$/.test(topic)) {
    return "ack";
  }

  return null;
}

/**
 * Chuyển MQTT packet thô thành thông điệp nội bộ đã validate.
 *
 * Hàm này là ranh giới giữa MQTT và domain worker:
 * - topic không hỗ trợ sẽ bị bỏ qua;
 * - payload không phải JSON hợp lệ sẽ bị log và bỏ qua;
 * - payload không khớp schema của từng loại thông điệp sẽ bị log và bỏ qua.
 *
 * Downstream chỉ nhận `IncomingDeviceRuntimeMessage`, nên không cần biết chi tiết
 * về Buffer, JSON parsing, hoặc schema validation.
 *
 * @param topic Topic MQTT nhận từ broker.
 * @param payloadBuffer Payload thô từ MQTT.js dưới dạng Buffer.
 * @returns Thông điệp nội bộ đã validate, hoặc `null` nếu packet cần bị bỏ qua.
 */
export function parseDeviceRuntimeMessage(
  topic: string,
  payloadBuffer: Buffer,
): IncomingDeviceRuntimeMessage | null {
  const payloadText = payloadBuffer.toString("utf8");
  const kind = resolveDeviceRuntimeTopicKind(topic);

  if (!kind) {
    logger.debug({ topic }, "Ignored MQTT message outside device runtime topics");
    return null;
  }

  try {
    const payload = JSON.parse(payloadText) as unknown;

    switch (kind) {
      case "tap": {
        const parsed = DeviceTapEventSchema.safeParse(payload);
        if (!parsed.success) {
          logger.warn({ topic, issues: parsed.error.flatten() }, "Discarded invalid device tap event");
          return null;
        }

        return { kind, topic, payload: parsed.data };
      }
      case "status": {
        const parsed = DeviceRuntimeStatusSchema.safeParse(payload);
        if (!parsed.success) {
          logger.warn({ topic, issues: parsed.error.flatten() }, "Discarded invalid device runtime status");
          return null;
        }

        return { kind, topic, payload: parsed.data };
      }
      case "ack": {
        const parsed = DeviceAcknowledgementSchema.safeParse(payload);
        if (!parsed.success) {
          logger.warn({ topic, issues: parsed.error.flatten() }, "Discarded invalid device acknowledgement");
          return null;
        }

        return { kind, topic, payload: parsed.data };
      }
    }
  }
  catch (error) {
    logger.error({ err: error, topic, payloadText }, "Failed to parse device runtime payload");
    return null;
  }
}
