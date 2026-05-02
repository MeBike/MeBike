import { DeviceTapEventSchema } from "@mebike/shared";
import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";

import { runEffectWithLayer } from "@/test/effect/run";

import { DeviceCommandServiceTag } from "../device-command.live";
import { DeviceTapDecisionServiceTag } from "../device-tap-decision.service";
import { DeviceTapServiceLive, DeviceTapServiceTag } from "../device-tap.service";

describe("device tap service", () => {
  it("publishes deny command from tap decision", async () => {
    const denyCalls: string[] = [];
    const event = DeviceTapEventSchema.parse({
      requestId: "req-deny",
      deviceId: "bike-1",
      cardUid: "999888777",
      timestampMs: 1,
    });

    const layer = DeviceTapServiceLive.pipe(Layer.provide(Layer.mergeAll(
      Layer.succeed(DeviceTapDecisionServiceTag, DeviceTapDecisionServiceTag.make({
        decideTapEvent: () => Effect.succeed({
          _tag: "Deny",
          reason: "CARD_LOST",
          userId: "user-1",
        }),
      })),
      Layer.succeed(DeviceCommandServiceTag, DeviceCommandServiceTag.make({
        sendCommand: () => Effect.void,
        sendUnlock: () => Effect.void,
        sendPing: () => Effect.void,
        sendDeny: ({ reason }) => Effect.sync(() => {
          denyCalls.push(reason);
        }),
      })),
    )));

    const result = await runEffectWithLayer(
      Effect.flatMap(DeviceTapServiceTag, service => service.handleTapEvent(event)),
      layer,
    );

    expect(result).toEqual({
      requestId: event.requestId,
      bikeId: event.deviceId,
      decision: "deny",
      reason: "CARD_LOST",
      userId: "user-1",
    });
    expect(denyCalls).toEqual(["CARD_LOST"]);
  });

  it("publishes unlock command from tap decision", async () => {
    const unlockCalls: string[] = [];
    const event = DeviceTapEventSchema.parse({
      requestId: "req-unlock",
      deviceId: "bike-2",
      cardUid: "123456789",
      timestampMs: 1,
    });

    const layer = DeviceTapServiceLive.pipe(Layer.provide(Layer.mergeAll(
      Layer.succeed(DeviceTapDecisionServiceTag, DeviceTapDecisionServiceTag.make({
        decideTapEvent: () => Effect.succeed({
          _tag: "Unlock",
          userId: "user-2",
          rentalId: "rental-1",
        }),
      })),
      Layer.succeed(DeviceCommandServiceTag, DeviceCommandServiceTag.make({
        sendCommand: () => Effect.void,
        sendUnlock: ({ requestId }) => Effect.sync(() => {
          unlockCalls.push(requestId);
        }),
        sendPing: () => Effect.void,
        sendDeny: () => Effect.void,
      })),
    )));

    const result = await runEffectWithLayer(
      Effect.flatMap(DeviceTapServiceTag, service => service.handleTapEvent(event)),
      layer,
    );

    expect(result).toEqual({
      requestId: event.requestId,
      bikeId: event.deviceId,
      decision: "unlock",
      userId: "user-2",
      rentalId: "rental-1",
    });
    expect(unlockCalls).toEqual([event.requestId]);
  });
});
