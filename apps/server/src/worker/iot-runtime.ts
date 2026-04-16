import {
  DEVICE_TOPIC_PATTERNS,
  DeviceAcknowledgementSchema,
  DeviceRuntimeStatusSchema,
  DeviceTapEventSchema,
} from "@mebike/shared";
import { Effect, Layer, ManagedRuntime } from "effect";
import process from "node:process";

import {
  DeviceAccessCommandServiceLive,
  DeviceCommandServiceLive,
  DeviceTapServiceLive,
  DeviceTapServiceTag,
} from "@/domain/iot";
import { ReservationDepsLive, UserDepsLive } from "@/http/shared/providers";
import { Mqtt, MqttLive } from "@/infrastructure/mqtt";
import logger from "@/lib/logger";

/**
 * Layer cho service publish command thiết bị, chỉ phụ thuộc MQTT.
 */
const DeviceCommandDepsLive = DeviceCommandServiceLive.pipe(
  Layer.provide(MqttLive),
);

/**
 * Layer cho adapter command IoT, dùng lại các deps reservation/rental hiện có.
 */
const DeviceAccessCommandDepsLive = DeviceAccessCommandServiceLive.pipe(
  Layer.provide(ReservationDepsLive),
);

/**
 * Runtime layer đầy đủ cho worker MQTT của IoT.
 */
const DeviceRuntimeWorkerLive = Layer.mergeAll(
  MqttLive,
  UserDepsLive,
  ReservationDepsLive,
  DeviceCommandDepsLive,
  DeviceAccessCommandDepsLive,
  DeviceTapServiceLive.pipe(
    Layer.provide(UserDepsLive),
    Layer.provide(ReservationDepsLive),
    Layer.provide(DeviceCommandDepsLive),
    Layer.provide(DeviceAccessCommandDepsLive),
  ),
);

/**
 * Phân loại topic để route message vào đúng nhánh xử lý.
 */
function topicKind(topic: string): "tap" | "status" | "ack" | null {
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
 * Entry point cho worker MQTT IoT.
 */
async function main() {
  const runtime = ManagedRuntime.make(DeviceRuntimeWorkerLive);
  const runPromise = runtime.runPromise.bind(runtime);

  /**
   * Effect chính của worker:
   * - subscribe topic IoT
   * - nghe message từ broker
   * - validate payload
   * - dispatch vào tap/status/ack flow
   */
  const startIotRuntime = Effect.gen(function* () {
    const mqtt = yield* Mqtt;
    const deviceTapService = yield* DeviceTapServiceTag;

    yield* mqtt.subscribe([
      DEVICE_TOPIC_PATTERNS.tapEvents,
      DEVICE_TOPIC_PATTERNS.status,
      DEVICE_TOPIC_PATTERNS.acknowledgements,
    ]);

    yield* Effect.sync(() => {
      mqtt.client.on("message", (topic, payloadBuffer) => {
        const payloadText = payloadBuffer.toString("utf8");
        const kind = topicKind(topic);

        try {
          const payload = JSON.parse(payloadText) as unknown;

          switch (kind) {
            case "tap": {
              const parsed = DeviceTapEventSchema.safeParse(payload);
              if (!parsed.success) {
                logger.warn({ topic, issues: parsed.error.flatten() }, "Discarded invalid device tap event");
                return;
              }

              void runPromise(deviceTapService.handleTapEvent(parsed.data)).then(
                (result) => {
                  logger.info({ topic, tap: parsed.data, result }, "Processed device tap event");
                },
                (error) => {
                  logger.error({ err: error, topic, tap: parsed.data }, "Failed to process device tap event");
                },
              );
              return;
            }
            case "status": {
              const parsed = DeviceRuntimeStatusSchema.safeParse(payload);
              if (!parsed.success) {
                logger.warn({ topic, issues: parsed.error.flatten() }, "Discarded invalid device runtime status");
                return;
              }

              logger.info({ topic, status: parsed.data }, "Received device runtime status");
              return;
            }
            case "ack": {
              const parsed = DeviceAcknowledgementSchema.safeParse(payload);
              if (!parsed.success) {
                logger.warn({ topic, issues: parsed.error.flatten() }, "Discarded invalid device acknowledgement");
                return;
              }

              logger.info({ topic, acknowledgement: parsed.data }, "Received device acknowledgement");
              return;
            }
            case null:
              logger.debug({ topic }, "Ignored MQTT message outside device runtime topics");
          }
        }
        catch (error) {
          logger.error({ err: error, topic, payloadText }, "Failed to parse device runtime payload");
        }
      });
    });

    logger.info({
      topics: [
        DEVICE_TOPIC_PATTERNS.tapEvents,
        DEVICE_TOPIC_PATTERNS.status,
        DEVICE_TOPIC_PATTERNS.acknowledgements,
      ],
    }, "IoT MQTT runtime started");

    return yield* Effect.never;
  });

  const shutdown = async (signal?: string) => {
    if (signal) {
      logger.info({ signal }, "IoT runtime shutdown initiated");
    }

    await runtime.dispose();
  };

  process.on("SIGINT", () =>
    void shutdown("SIGINT").finally(() => process.exit(0)));
  process.on("SIGTERM", () =>
    void shutdown("SIGTERM").finally(() => process.exit(0)));

  await runPromise(startIotRuntime);
}

/**
 * Khởi động worker và log lỗi nếu bootstrap thất bại.
 */
main().catch((error) => {
  logger.error({ err: error }, "IoT runtime failed to start");
  process.exit(1);
});
