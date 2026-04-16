import type {
  IClientPublishOptions,
  IClientSubscribeOptions,
  MqttClient,
} from "mqtt";

import { Data, Effect, Layer } from "effect";
import { connectAsync } from "mqtt";

import { env } from "@/config/env";

/**
 * Giao diện tối thiểu để phần domain/worker thao tác với MQTT.
 */
export type MqttService = {
  readonly client: MqttClient;
  readonly publish: (
    topic: string,
    payload: string,
    options?: IClientPublishOptions,
  ) => Effect.Effect<void, MqttPublishError>;
  readonly subscribe: (
    topic: string | string[],
    options?: IClientSubscribeOptions,
  ) => Effect.Effect<void, MqttSubscribeError>;
};

/**
 * Lỗi khởi tạo kết nối MQTT.
 */
export class MqttInitError extends Data.TaggedError("MqttInitError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * Lỗi publish message lên MQTT broker.
 */
export class MqttPublishError extends Data.TaggedError("MqttPublishError")<{
  readonly topic: string;
  readonly cause?: unknown;
}> {}

/**
 * Lỗi subscribe topic trên MQTT broker.
 */
export class MqttSubscribeError extends Data.TaggedError("MqttSubscribeError")<{
  readonly topic: string | string[];
  readonly cause?: unknown;
}> {}

/**
 * Tạo MQTT client bằng Promise API mới của `mqtt.js`.
 */
const connectMqttClient = Effect.tryPromise({
  try: () =>
    connectAsync(env.IOT_MQTT_URL, {
      username: env.IOT_MQTT_USERNAME,
      password: env.IOT_MQTT_PASSWORD,
      connectTimeout: 3000,
      reconnectPeriod: 1000,
    }),
  catch: cause =>
    new MqttInitError({
      message: `Failed to initialize MQTT. Check IOT_MQTT_URL and broker reachability (${env.IOT_MQTT_URL}).`,
      cause,
    }),
});

/**
 * Tạo service MQTT có lifecycle rõ ràng: connect khi acquire, end khi release.
 */
const makeMqtt = Effect.gen(function* () {
  const client = yield* Effect.acquireRelease(
    connectMqttClient,
    client =>
      Effect.tryPromise({
        try: () => client.endAsync(),
        catch: cause =>
          new MqttInitError({
            message: "Failed to close MQTT client cleanly.",
            cause,
          }),
      }).pipe(Effect.orDie),
  );

  const service: MqttService = {
    client,
    publish: (topic, payload, options) =>
      Effect.tryPromise({
        try: async () => {
          await client.publishAsync(topic, payload, options ?? {});
        },
        catch: cause => new MqttPublishError({ topic, cause }),
      }),
    subscribe: (topic, options) =>
      Effect.tryPromise({
        try: async () => {
          await client.subscribeAsync(topic, options ?? {});
        },
        catch: cause => new MqttSubscribeError({ topic, cause }),
      }),
  };

  return service;
});

/**
 * Tag Effect đại diện cho MQTT service trong runtime.
 */
export class Mqtt extends Effect.Service<Mqtt>()("Mqtt", {
  scoped: makeMqtt,
}) {}

/**
 * Live layer cho MQTT. Chỉ provide ở boundary cần MQTT.
 */
export const MqttLive = Layer.scoped(
  Mqtt,
  makeMqtt.pipe(Effect.map(Mqtt.make)),
);
