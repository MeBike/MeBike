import type { Buffer } from "node:buffer";

import { DEVICE_TOPIC_PATTERNS } from "@mebike/shared";
import { Effect, ManagedRuntime } from "effect";
import process from "node:process";

import { Mqtt } from "@/infrastructure/mqtt";
import logger from "@/lib/logger";

import type { IotMessageQueueRuntime } from "./types";

import { DeviceRuntimeWorkerLive } from "./layers";
import { handleDeviceRuntimeMessage } from "./message-handler";
import { makeIotMessageQueueRuntime } from "./message-queue";
import { parseDeviceRuntimeMessage } from "./topic-router";
import {
  IOT_MESSAGE_QUEUE_CAPACITY,
  IOT_MESSAGE_WORKER_CONCURRENCY,
  IOT_SHUTDOWN_DRAIN_TIMEOUT_MS,
} from "./types";

/**
 * Khởi động tiến trình IoT MQTT worker.
 *
 * Luồng chính của worker:
 * 1. Tạo `ManagedRuntime` dài hạn cho MQTT và các service domain.
 * 2. Tạo queue nội bộ để tách MQTT callback khỏi xử lý domain dài.
 * 3. Gắn listener `message` trước khi subscribe để tránh mất packet đầu tiên.
 * 4. Subscribe các topic device runtime.
 * 5. Khi shutdown, dừng intake, đợi queue drain, rồi dispose runtime.
 */
async function main() {
  const runtime = ManagedRuntime.make(DeviceRuntimeWorkerLive);
  let queueRuntime: IotMessageQueueRuntime | null = null;
  let stopMqttIntake: (() => void) | null = null;

  /**
   * Effect chạy suốt vòng đời worker IoT.
   *
   * Effect này giữ MQTT listener và queue sống trong một scope. Khi scope bị
   * dispose, finalizer sẽ tháo listener khỏi MQTT client và shutdown queue.
   */
  const startIotRuntime = Effect.gen(function* () {
    const mqtt = yield* Mqtt;
    const queue = yield* makeIotMessageQueueRuntime({
      capacity: IOT_MESSAGE_QUEUE_CAPACITY,
      concurrency: IOT_MESSAGE_WORKER_CONCURRENCY,
      drainTimeoutMs: IOT_SHUTDOWN_DRAIN_TIMEOUT_MS,
      handleMessage: handleDeviceRuntimeMessage,
    });

    const onMessage = (topic: string, payloadBuffer: Buffer) => {
      const message = parseDeviceRuntimeMessage(topic, payloadBuffer);
      if (!message) {
        return;
      }

      queue.enqueue(message);
    };

    yield* Effect.sync(() => {
      queueRuntime = queue;
      stopMqttIntake = () => {
        mqtt.client.off("message", onMessage);
        queue.stopIntake();
      };
      mqtt.client.on("message", onMessage);
    });

    yield* Effect.addFinalizer(() =>
      Effect.sync(() => {
        stopMqttIntake?.();
        stopMqttIntake = null;
        queueRuntime = null;
      }));

    yield* mqtt.subscribe([
      DEVICE_TOPIC_PATTERNS.tapEvents,
      DEVICE_TOPIC_PATTERNS.status,
      DEVICE_TOPIC_PATTERNS.acknowledgements,
    ]);

    logger.info({
      topics: [
        DEVICE_TOPIC_PATTERNS.tapEvents,
        DEVICE_TOPIC_PATTERNS.status,
        DEVICE_TOPIC_PATTERNS.acknowledgements,
      ],
    }, "IoT MQTT runtime started");

    return yield* Effect.never;
  });

  /**
   * Shutdown có kiểm soát cho process signal.
   *
   * @param signal Tên signal hệ điều hành đã kích hoạt shutdown, nếu có.
   */
  const shutdown = async (signal?: string) => {
    if (signal) {
      logger.info({ signal }, "IoT runtime shutdown initiated");
    }

    stopMqttIntake?.();
    await queueRuntime?.waitForDrain();
    await runtime.dispose();
  };

  process.on("SIGINT", () =>
    void shutdown("SIGINT").finally(() => process.exit(0)));
  process.on("SIGTERM", () =>
    void shutdown("SIGTERM").finally(() => process.exit(0)));

  await runtime.runPromise(Effect.scoped(startIotRuntime));
}

main().catch((error) => {
  logger.error({ err: error }, "IoT runtime failed to start");
  process.exit(1);
});
