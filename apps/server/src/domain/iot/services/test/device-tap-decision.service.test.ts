import { DeviceTapEventSchema } from "@mebike/shared";
import { Effect, Layer, Option } from "effect";
import { describe, expect, it } from "vitest";

import { BikeRepository } from "@/domain/bikes";
import { NfcCardQueryServiceTag } from "@/domain/nfc-cards";
import { ReservationQueryServiceTag } from "@/domain/reservations";
import { runEffectWithLayer } from "@/test/effect/run";

import { DeviceAccessCommandServiceTag } from "../device-access-command.service";
import { DeviceTapDecisionServiceLive, DeviceTapDecisionServiceTag } from "../device-tap-decision.service";

const emptyCardList = {
  items: [],
  page: 1,
  pageSize: 50,
  total: 0,
  totalPages: 0,
};

describe("device tap decision service", () => {
  it("denies lost cards as CARD_LOST before assignment fallback", async () => {
    const event = DeviceTapEventSchema.parse({
      requestId: "req-lost",
      deviceId: "bike-1",
      cardUid: "999888777",
      timestampMs: 1,
    });

    const deps = Layer.mergeAll(
      Layer.succeed(NfcCardQueryServiceTag, NfcCardQueryServiceTag.make({
        getById: () => Effect.succeed(Option.none()),
        findByUid: () => Effect.succeed(Option.some({
          id: "card-lost",
          uid: event.cardUid,
          status: "LOST",
          assignedUserId: null,
          assignedUser: null,
          issuedAt: null,
          returnedAt: null,
          blockedAt: null,
          lostAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
        findByAssignedUserId: () => Effect.succeed(Option.none()),
        list: () => Effect.succeed(emptyCardList),
      })),
      Layer.succeed(BikeRepository, BikeRepository.make({
        getById: () => Effect.die("bike lookup should not run for lost card"),
      } as never)),
      Layer.succeed(ReservationQueryServiceTag, ReservationQueryServiceTag.make({
        getCurrentHoldForUserNow: () => Effect.succeed(Option.none()),
      } as never)),
      Layer.succeed(DeviceAccessCommandServiceTag, DeviceAccessCommandServiceTag.make({
        confirmReservation: () => Effect.die("reservation confirm should not run for lost card"),
        startRental: () => Effect.die("rental start should not run for lost card"),
      })),
    );
    const layer = DeviceTapDecisionServiceLive.pipe(Layer.provide(deps));

    const result = await runEffectWithLayer(
      Effect.flatMap(DeviceTapDecisionServiceTag, service => service.decideTapEvent(event)),
      layer,
    );

    expect(result).toEqual({
      _tag: "Deny",
      reason: "CARD_LOST",
    });
  });

  it("denies blocked cards before rental flow starts", async () => {
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
        list: () => Effect.succeed(emptyCardList),
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
    );
    const layer = DeviceTapDecisionServiceLive.pipe(Layer.provide(deps));

    const result = await runEffectWithLayer(
      Effect.flatMap(DeviceTapDecisionServiceTag, service => service.decideTapEvent(event)),
      layer,
    );

    expect(result).toEqual({
      _tag: "Deny",
      reason: "CARD_BLOCKED",
      userId: "user-1",
    });
  });

  it("denies unverified users even when card is active", async () => {
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
        list: () => Effect.succeed(emptyCardList),
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
    );
    const layer = DeviceTapDecisionServiceLive.pipe(Layer.provide(deps));

    const result = await runEffectWithLayer(
      Effect.flatMap(DeviceTapDecisionServiceTag, service => service.decideTapEvent(event)),
      layer,
    );

    expect(result).toEqual({
      _tag: "Deny",
      reason: "USER_NOT_VERIFIED",
      userId: "user-2",
    });
  });
});
