import type { DeviceAcknowledgement, DeviceRuntimeStatus, DeviceTapEvent } from "@mebike/shared";
import type { Buffer } from "node:buffer";

import {
  DEVICE_TOPIC_PATTERNS,

  DeviceAcknowledgementSchema,
  DeviceRuntimeStatusSchema,
  DeviceTapEventSchema,
} from "@mebike/shared";
import { Effect, Layer, ManagedRuntime, Queue } from "effect";
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

const MESSAGE_QUEUE_CAPACITY = 256;
const MESSAGE_WORKER_CONCURRENCY = 4;
const SHUTDOWN_DRAIN_TIMEOUT_MS = 5000;

type IncomingDeviceRuntimeMessage
  = | { kind: "tap"; topic: string; payload: DeviceTapEvent }
    | { kind: "status"; topic: string; payload: DeviceRuntimeStatus }
    | { kind: "ack"; topic: string; payload: DeviceAcknowledgement };

type WorkerDrainState = {
  readonly stopIntake: () => void;
  queuedMessages: number;
  inFlightMessages: number;
};

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
  let drainState: WorkerDrainState | null = null;

  const waitForDrain = async () => {
    const deadline = Date.now() + SHUTDOWN_DRAIN_TIMEOUT_MS;

    while (true) {
      if (!drainState || (drainState.queuedMessages === 0 && drainState.inFlightMessages === 0)) {
        return;
      }

      if (Date.now() >= deadline) {
        logger.warn({
          queuedMessages: drainState.queuedMessages,
          inFlightMessages: drainState.inFlightMessages,
        }, "Timed out waiting for IoT runtime queue to drain");
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

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
    const messageQueue = yield* Queue.dropping<IncomingDeviceRuntimeMessage>(MESSAGE_QUEUE_CAPACITY);

    const processMessage = (message: IncomingDeviceRuntimeMessage) => {
      switch (message.kind) {
        case "tap":
          return deviceTapService.handleTapEvent(message.payload).pipe(
            Effect.tap(result =>
              Effect.sync(() => {
                logger.info({ topic: message.topic, tap: message.payload, result }, "Processed device tap event");
              })),
            Effect.catchAll(error =>
              Effect.sync(() => {
                logger.error({ err: error, topic: message.topic, tap: message.payload }, "Failed to process device tap event");
              })),
            Effect.asVoid,
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
    };

    const worker = Queue.take(messageQueue).pipe(
      Effect.tap(() => Effect.sync(() => {
        if (drainState) {
          drainState.queuedMessages -= 1;
          drainState.inFlightMessages += 1;
        }
      })),
      Effect.flatMap(message =>
        processMessage(message).pipe(
          Effect.ensuring(Effect.sync(() => {
            if (drainState) {
              drainState.inFlightMessages -= 1;
            }
          })),
        )),
      Effect.forever,
    );

    yield* Effect.all(
      Array.from({ length: MESSAGE_WORKER_CONCURRENCY }, () => worker.pipe(Effect.forkScoped)),
      { concurrency: "unbounded" },
    );

    yield* mqtt.subscribe([
      DEVICE_TOPIC_PATTERNS.tapEvents,
      DEVICE_TOPIC_PATTERNS.status,
      DEVICE_TOPIC_PATTERNS.acknowledgements,
    ]);

    const enqueueMessage = (message: IncomingDeviceRuntimeMessage) => {
      const offered = messageQueue.unsafeOffer(message);
      if (!offered) {
        logger.warn({
          topic: message.topic,
          kind: message.kind,
          capacity: MESSAGE_QUEUE_CAPACITY,
        }, "Dropped IoT runtime message because queue is full or shutdown");
        return;
      }

      if (drainState) {
        drainState.queuedMessages += 1;
      }
    };

    const onMessage = (topic: string, payloadBuffer: Buffer) => {
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

            enqueueMessage({ kind: "tap", topic, payload: parsed.data });
            return;
          }
          case "status": {
            const parsed = DeviceRuntimeStatusSchema.safeParse(payload);
            if (!parsed.success) {
              logger.warn({ topic, issues: parsed.error.flatten() }, "Discarded invalid device runtime status");
              return;
            }

            enqueueMessage({ kind: "status", topic, payload: parsed.data });
            return;
          }
          case "ack": {
            const parsed = DeviceAcknowledgementSchema.safeParse(payload);
            if (!parsed.success) {
              logger.warn({ topic, issues: parsed.error.flatten() }, "Discarded invalid device acknowledgement");
              return;
            }

            enqueueMessage({ kind: "ack", topic, payload: parsed.data });
            return;
          }
          case null:
            logger.debug({ topic }, "Ignored MQTT message outside device runtime topics");
        }
      }
      catch (error) {
        logger.error({ err: error, topic, payloadText }, "Failed to parse device runtime payload");
      }
    };

    yield* Effect.sync(() => {
      const stopIntake = () => {
        mqtt.client.off("message", onMessage);
      };

      drainState = {
        stopIntake,
        queuedMessages: 0,
        inFlightMessages: 0,
      };

      mqtt.client.on("message", onMessage);
    });

    yield* Effect.addFinalizer(() =>
      Effect.sync(() => {
        drainState?.stopIntake();
        drainState = null;
      }).pipe(Effect.zipRight(messageQueue.shutdown)));

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

    drainState?.stopIntake();
    await waitForDrain();

    await runtime.dispose();
  };

  process.on("SIGINT", () =>
    void shutdown("SIGINT").finally(() => process.exit(0)));
  process.on("SIGTERM", () =>
    void shutdown("SIGTERM").finally(() => process.exit(0)));

  await runtime.runPromise(Effect.scoped(startIotRuntime));
}

/**
 * Khởi động worker và log lỗi nếu bootstrap thất bại.
 */
main().catch((error) => {
  logger.error({ err: error }, "IoT runtime failed to start");
  process.exit(1);
});
