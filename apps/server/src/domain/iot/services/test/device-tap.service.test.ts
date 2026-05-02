import { DeviceTapEventSchema } from "@mebike/shared";
import { Effect, Layer, Option } from "effect";
import { describe, expect, it } from "vitest";

import { BikeRepository } from "@/domain/bikes";
import { NfcCardQueryServiceTag } from "@/domain/nfc-cards";
import { ReservationQueryServiceTag } from "@/domain/reservations";
import { runEffectWithLayer } from "@/test/effect/run";

import { DeviceAccessCommandServiceTag } from "../device-access-command.service";
import { DeviceCommandServiceTag } from "../device-command.live";
import { DeviceTapServiceLive, DeviceTapServiceTag } from "../device-tap.service";

describe("device tap service", () => {
  it("denies blocked cards before rental flow starts", async () => {
    const denyCalls: string[] = [];
    const event = DeviceTapEventSchema.parse({
      requestId: "req-1",
      deviceId: "bike-1",
      cardUid: "123456789",
      timestampMs: 1,
    });

    const deps = Layer.mergeAll(
      Layer.succeed(NfcCardQueryServiceTag, NfcCardQueryServiceTag.make({
        getById: () => Effect.succeed(Option.none()),
        findByUid: () => Effect.succeed(Option.some({
          id: "card-1",
          uid: event.cardUid,
          status: "BLOCKED",
          assignedUserId: "user-1",
          assignedUser: {
            id: "user-1",
            fullname: "Blocked User",
            email: "blocked@example.com",
            accountStatus: "ACTIVE",
            verify: "VERIFIED",
          },
          issuedAt: null,
          returnedAt: null,
          blockedAt: new Date(),
          lostAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
        findByAssignedUserId: () => Effect.succeed(Option.none()),
        list: () => Effect.succeed([]),
      })),
      Layer.succeed(BikeRepository, BikeRepository.make({
        getById: () => Effect.die("bike lookup should not run for blocked card"),
      } as never)),
      Layer.succeed(ReservationQueryServiceTag, ReservationQueryServiceTag.make({
        getCurrentHoldForUserNow: () => Effect.succeed(Option.none()),
      } as never)),
      Layer.succeed(DeviceAccessCommandServiceTag, DeviceAccessCommandServiceTag.make({
        confirmReservation: () => Effect.die("reservation confirm should not run for blocked card"),
        startRental: () => Effect.die("rental start should not run for blocked card"),
      })),
      Layer.succeed(DeviceCommandServiceTag, DeviceCommandServiceTag.make({
        sendCommand: () => Effect.void,
        sendUnlock: () => Effect.void,
        sendPing: () => Effect.void,
        sendDeny: ({ reason }) => Effect.sync(() => {
          denyCalls.push(reason);
        }),
      })),
    );
    const layer = DeviceTapServiceLive.pipe(Layer.provide(deps));

    const result = await runEffectWithLayer(
      Effect.flatMap(DeviceTapServiceTag, service => service.handleTapEvent(event)),
      layer,
    );

    expect(result.decision).toBe("deny");
    expect(result.reason).toBe("CARD_BLOCKED");
    expect(denyCalls).toEqual(["CARD_BLOCKED"]);
  });

  it("denies unverified users even when card is active", async () => {
    const denyCalls: string[] = [];
    const event = DeviceTapEventSchema.parse({
      requestId: "req-2",
      deviceId: "bike-1",
      cardUid: "456789123",
      timestampMs: 1,
    });

    const deps = Layer.mergeAll(
      Layer.succeed(NfcCardQueryServiceTag, NfcCardQueryServiceTag.make({
        getById: () => Effect.succeed(Option.none()),
        findByUid: () => Effect.succeed(Option.some({
          id: "card-2",
          uid: event.cardUid,
          status: "ACTIVE",
          assignedUserId: "user-2",
          assignedUser: {
            id: "user-2",
            fullname: "Unverified User",
            email: "unverified@example.com",
            accountStatus: "ACTIVE",
            verify: "UNVERIFIED",
          },
          issuedAt: new Date(),
          returnedAt: null,
          blockedAt: null,
          lostAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
        findByAssignedUserId: () => Effect.succeed(Option.none()),
        list: () => Effect.succeed([]),
      })),
      Layer.succeed(BikeRepository, BikeRepository.make({
        getById: () => Effect.die("bike lookup should not run for unverified user"),
      } as never)),
      Layer.succeed(ReservationQueryServiceTag, ReservationQueryServiceTag.make({
        getCurrentHoldForUserNow: () => Effect.succeed(Option.none()),
      } as never)),
      Layer.succeed(DeviceAccessCommandServiceTag, DeviceAccessCommandServiceTag.make({
        confirmReservation: () => Effect.die("reservation confirm should not run for unverified user"),
        startRental: () => Effect.die("rental start should not run for unverified user"),
      })),
      Layer.succeed(DeviceCommandServiceTag, DeviceCommandServiceTag.make({
        sendCommand: () => Effect.void,
        sendUnlock: () => Effect.void,
        sendPing: () => Effect.void,
        sendDeny: ({ reason }) => Effect.sync(() => {
          denyCalls.push(reason);
        }),
      })),
    );
    const layer = DeviceTapServiceLive.pipe(Layer.provide(deps));

    const result = await runEffectWithLayer(
      Effect.flatMap(DeviceTapServiceTag, service => service.handleTapEvent(event)),
      layer,
    );

    expect(result.decision).toBe("deny");
    expect(result.reason).toBe("USER_NOT_VERIFIED");
    expect(denyCalls).toEqual(["USER_NOT_VERIFIED"]);
  });
});
