import type { DeviceTapEvent } from "@mebike/shared";

import { Effect, Layer } from "effect";

import type { MqttPublishError } from "@/infrastructure/mqtt";

import { DeviceCommandServiceTag } from "./device-command.live";
import { DeviceTapDecisionServiceTag } from "./device-tap-decision.service";

/**
 * Kết quả cuối cùng của một tap event sau khi server ra quyết định.
 */
export type DeviceTapHandlingResult = {
  readonly requestId: string;
  readonly bikeId: string;
  readonly decision: "unlock" | "deny";
  readonly reason?: string;
  readonly userId?: string;
  readonly reservationId?: string;
  readonly rentalId?: string;
};

/**
 * Service điều phối toàn bộ luồng quẹt thẻ trên bike.
 */
export type DeviceTapService = {
  readonly handleTapEvent: (
    event: DeviceTapEvent,
    options?: { readonly now?: Date },
  ) => Effect.Effect<DeviceTapHandlingResult, MqttPublishError>;
};

/**
 * Khởi tạo live implementation cho tap service.
 */
const makeDeviceTapServiceEffect = Effect.gen(function* () {
  const deviceCommandService = yield* DeviceCommandServiceTag;
  const decisionService = yield* DeviceTapDecisionServiceTag;

  const denyTap = (
    event: DeviceTapEvent,
    reason: string,
    meta: Omit<DeviceTapHandlingResult, "bikeId" | "decision" | "requestId"> = {},
  ) =>
    deviceCommandService.sendDeny({
      deviceId: event.deviceId,
      requestId: event.requestId,
      reason,
    }).pipe(
      Effect.as({
        requestId: event.requestId,
        bikeId: event.deviceId,
        decision: "deny" as const,
        reason,
        ...meta,
      }),
    );

  const unlockTap = (
    event: DeviceTapEvent,
    meta: Omit<DeviceTapHandlingResult, "bikeId" | "decision" | "requestId">,
  ) =>
    deviceCommandService.sendUnlock({
      deviceId: event.deviceId,
      requestId: event.requestId,
    }).pipe(
      Effect.as({
        requestId: event.requestId,
        bikeId: event.deviceId,
        decision: "unlock" as const,
        ...meta,
      }),
    );

  /**
   * Logic chính của service này chỉ còn làm transport:
   * - lấy quyết định business từ decision service
   * - publish `unlock` hoặc `deny` xuống firmware
   */
  const service: DeviceTapService = {
    handleTapEvent: (event, options) =>
      Effect.gen(function* () {
        const decision = yield* decisionService.decideTapEvent(event, options);

        if (decision._tag === "Deny") {
          return yield* denyTap(event, decision.reason, {
            userId: decision.userId,
            reservationId: decision.reservationId,
          });
        }

        return yield* unlockTap(event, {
          userId: decision.userId,
          reservationId: decision.reservationId,
          rentalId: decision.rentalId,
        });
      }),
  };

  return service;
});

/**
 * Tag Effect cho tap orchestration service.
 */
export class DeviceTapServiceTag extends Effect.Service<DeviceTapServiceTag>()(
  "DeviceTapService",
  {
    effect: makeDeviceTapServiceEffect,
  },
) {}

/**
 * Live layer cho tap orchestration service.
 */
export const DeviceTapServiceLive = Layer.effect(
  DeviceTapServiceTag,
  makeDeviceTapServiceEffect.pipe(Effect.map(DeviceTapServiceTag.make)),
);
