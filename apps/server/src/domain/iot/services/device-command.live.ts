import { Effect, Layer } from "effect";

import { Mqtt } from "@/infrastructure/mqtt";

import { makeDeviceCommandService } from "./device-command.service";

export type { DeviceCommandService, SendDeviceCommandInput } from "./device-command.service";

/**
 * Khởi tạo live implementation cho service gửi command thiết bị.
 */
const makeDeviceCommandServiceEffect = Effect.gen(function* () {
  const mqtt = yield* Mqtt;

  return makeDeviceCommandService({ mqtt });
});

/**
 * Tag Effect cho service gửi command thiết bị.
 */
export class DeviceCommandServiceTag extends Effect.Service<DeviceCommandServiceTag>()(
  "DeviceCommandService",
  {
    effect: makeDeviceCommandServiceEffect,
  },
) {}

/**
 * Live layer cho DeviceCommandService.
 */
export const DeviceCommandServiceLive = Layer.effect(
  DeviceCommandServiceTag,
  makeDeviceCommandServiceEffect.pipe(Effect.map(DeviceCommandServiceTag.make)),
);
