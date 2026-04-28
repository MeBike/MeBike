import type { Scope } from "effect";

import { Effect, Queue } from "effect";

import logger from "@/lib/logger";

import type {
  IncomingDeviceRuntimeMessage,
  IotMessageQueueRuntime,
} from "./types";

type IotMessageQueueOptions<R> = {
  readonly capacity: number;
  readonly concurrency: number;
  readonly drainTimeoutMs: number;
  readonly handleMessage: (message: IncomingDeviceRuntimeMessage) => Effect.Effect<void, never, R>;
};

/**
 * Tạo queue nội bộ nằm giữa MQTT callback và domain handler.
 *
 * MQTT callback cần chạy nhanh, không được block bằng các thao tác DB/domain dài.
 * Vì vậy callback chỉ parse/validate rồi enqueue. Các fiber worker sẽ lấy message
 * từ queue và chạy `handleMessage` với giới hạn concurrency cố định.
 *
 * Chính sách backpressure:
 * - queue có sức chứa cố định;
 * - khi đầy hoặc đang shutdown, message mới bị drop và log cảnh báo;
 * - shutdown dừng intake trước, sau đó đợi message đang queue/in-flight drain
 *   trong giới hạn timeout.
 *
 * @param options Cấu hình sức chứa, concurrency, timeout drain và handler xử lý.
 * @param options.capacity Số message tối đa giữ trong queue.
 * @param options.concurrency Số fiber xử lý message song song.
 * @param options.drainTimeoutMs Thời gian tối đa đợi queue drain khi shutdown.
 * @param options.handleMessage Handler Effect cho một message đã validate.
 * @returns Runtime nhỏ để enqueue message và điều phối shutdown queue.
 */
export function makeIotMessageQueueRuntime<R>(
  options: IotMessageQueueOptions<R>,
): Effect.Effect<IotMessageQueueRuntime, never, R | Scope.Scope> {
  return Effect.gen(function* () {
    const messageQueue = yield* Queue.dropping<IncomingDeviceRuntimeMessage>(options.capacity);
    let acceptingMessages = true;
    let queuedMessages = 0;
    let inFlightMessages = 0;

    const worker = Queue.take(messageQueue).pipe(
      Effect.tap(() => Effect.sync(() => {
        queuedMessages = Math.max(0, queuedMessages - 1);
        inFlightMessages += 1;
      })),
      Effect.flatMap(message =>
        options.handleMessage(message).pipe(
          Effect.ensuring(Effect.sync(() => {
            inFlightMessages = Math.max(0, inFlightMessages - 1);
          })),
        )),
      Effect.forever,
    );

    yield* Effect.all(
      Array.from({ length: options.concurrency }, () => worker.pipe(Effect.forkScoped)),
      { concurrency: "unbounded" },
    );

    const waitForDrain = async () => {
      const deadline = Date.now() + options.drainTimeoutMs;

      while (true) {
        if (queuedMessages === 0 && inFlightMessages === 0) {
          return;
        }

        if (Date.now() >= deadline) {
          logger.warn({
            queuedMessages,
            inFlightMessages,
          }, "Timed out waiting for IoT runtime queue to drain");
          return;
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      }
    };

    const runtime: IotMessageQueueRuntime = {
      enqueue: (message) => {
        if (!acceptingMessages) {
          logger.warn({
            topic: message.topic,
            kind: message.kind,
          }, "Dropped IoT runtime message because intake is stopped");
          return;
        }

        const offered = messageQueue.unsafeOffer(message);
        if (!offered) {
          logger.warn({
            topic: message.topic,
            kind: message.kind,
            capacity: options.capacity,
          }, "Dropped IoT runtime message because queue is full or shutdown");
          return;
        }

        queuedMessages += 1;
      },
      stopIntake: () => {
        acceptingMessages = false;
      },
      waitForDrain,
    };

    yield* Effect.addFinalizer(() =>
      Effect.sync(() => {
        acceptingMessages = false;
      }).pipe(Effect.zipRight(messageQueue.shutdown)));

    return runtime;
  });
}
