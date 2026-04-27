import { Effect } from "effect";

import { DeviceTapServiceTag } from "@/domain/iot";
import logger from "@/lib/logger";

import type { IncomingDeviceRuntimeMessage } from "./types";

/**
 * Xử lý một thông điệp IoT đã được validate từ queue nội bộ.
 *
 * Tap event đi vào domain workflow vì nó có thể mở khóa xe, xác nhận thuê xe,
 * hoặc phát lệnh xuống thiết bị. Status và acknowledgement hiện chỉ được quan
 * sát qua log để phục vụ vận hành.
 *
 * Lỗi domain được bắt và log tại đây để một thông điệp lỗi không làm chết fiber
 * xử lý queue. Retry ở tầng MQTT không tồn tại trong runtime này, nên handler
 * phải giữ worker sống và để hệ thống quan sát qua log/metrics.
 *
 * @param message Thông điệp nội bộ đã được router validate.
 * @returns Effect hoàn tất khi thông điệp đã được xử lý hoặc đã log lỗi.
 */
export function handleDeviceRuntimeMessage(
  message: IncomingDeviceRuntimeMessage,
): Effect.Effect<void, never, DeviceTapServiceTag> {
  switch (message.kind) {
    case "tap":
      return DeviceTapServiceTag.pipe(
        Effect.flatMap(deviceTapService =>
          deviceTapService.handleTapEvent(message.payload).pipe(
            Effect.tap(result =>
              Effect.sync(() => {
                logger.info({ topic: message.topic, tap: message.payload, result }, "Processed device tap event");
              })),
            Effect.catchAll(error =>
              Effect.sync(() => {
                logger.error({ err: error, topic: message.topic, tap: message.payload }, "Failed to process device tap event");
              })),
            Effect.asVoid,
          )),
      );
    case "status":
      return Effect.sync(() => {
        logger.info({ topic: message.topic, status: message.payload }, "Received device runtime status");
      });
    case "ack":
      return Effect.sync(() => {
        logger.info({ topic: message.topic, acknowledgement: message.payload }, "Received device acknowledgement");
      });
  }
}
