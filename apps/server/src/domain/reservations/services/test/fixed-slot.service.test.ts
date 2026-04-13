import { Effect, Layer, Option } from "effect";
import { describe, expect, it, vi } from "vitest";

import { BikeRepository } from "@/domain/bikes";
import { Prisma } from "@/infrastructure/prisma";
import { runEffectWithLayer } from "@/test/effect/run";

import { assignFixedSlotReservations } from "../fixed-slot/fixed-slot.service";

const mocks = vi.hoisted(() => ({
  makeBikeRepository: vi.fn(),
  makeReservationQueryRepository: vi.fn(),
  makeReservationCommandRepository: vi.fn(),
  enqueueOutboxJobInTx: vi.fn(),
  buildFixedSlotAssignedEmail: vi.fn(() => ({ subject: "assigned", html: "assigned" })),
  buildFixedSlotNoBikeEmail: vi.fn(() => ({ subject: "no-bike", html: "no-bike" })),
}));

vi.mock("@/domain/bikes", async () => {
  const actual = await vi.importActual<typeof import("@/domain/bikes")>("@/domain/bikes");
  return {
    ...actual,
    makeBikeRepository: mocks.makeBikeRepository,
  };
});

vi.mock("../../repository/reservation-query.repository", () => ({
  makeReservationQueryRepository: mocks.makeReservationQueryRepository,
}));

vi.mock("../../repository/reservation-command.repository", () => ({
  makeReservationCommandRepository: mocks.makeReservationCommandRepository,
}));

vi.mock("@/infrastructure/jobs/outbox-enqueue", () => ({
  enqueueOutboxJobInTx: mocks.enqueueOutboxJobInTx,
}));

vi.mock("@/lib/email-templates", () => ({
  buildFixedSlotAssignedEmail: mocks.buildFixedSlotAssignedEmail,
  buildFixedSlotNoBikeEmail: mocks.buildFixedSlotNoBikeEmail,
}));

type DraftState = {
  reservationBikeId: string | null;
  bikeStatus: "AVAILABLE" | "RESERVED";
};

describe("assignFixedSlotReservations", () => {
  it("rolls back reservation bike assignment when bike reservation conflicts", async () => {
    const slotDate = new Date(Date.UTC(2026, 3, 14));
    const slotStart = new Date(Date.UTC(2000, 0, 1, 9, 0, 0));
    const reservation = { id: "reservation-1" };
    const bike = { id: "bike-1" };
    const template = {
      id: "template-1",
      userId: "user-1",
      stationId: "station-1",
      slotStart,
      user: { fullName: "Test User", email: "user@example.com" },
      station: { name: "Test Station" },
    };
    const state: DraftState = {
      reservationBikeId: null,
      bikeStatus: "AVAILABLE",
    };

    mocks.makeReservationQueryRepository.mockImplementation((client: { state?: DraftState }) => {
      if (client.state) {
        return {
          findPendingFixedSlotByTemplateAndStart: () => Effect.succeed(
            client.state!.reservationBikeId === null ? Option.some(reservation) : Option.none(),
          ),
        };
      }

      return {
        listActiveFixedSlotTemplatesByDate: () => Effect.succeed([template]),
      };
    });

    mocks.makeReservationCommandRepository.mockImplementation((tx: { state: DraftState }) => ({
      assignBikeToPendingReservation: (_reservationId: string, bikeId: string) =>
        Effect.sync(() => {
          if (tx.state.reservationBikeId !== null) {
            return false;
          }
          tx.state.reservationBikeId = bikeId;
          return true;
        }),
    }));

    mocks.makeBikeRepository.mockImplementation((tx: { state: DraftState }) => ({
      findAvailableByStation: () => Effect.succeed(
        tx.state.bikeStatus === "AVAILABLE" ? Option.some(bike) : Option.none(),
      ),
      reserveBikeIfAvailable: () => Effect.succeed(false),
    }));

    const client = {
      fixedSlotTemplate: {
        findMany: vi.fn(async () => [template]),
      },
      $transaction: async <T>(callback: (tx: { state: DraftState }) => Promise<T>) => {
        const draft: DraftState = { ...state };
        const result = await callback({ state: draft });
        state.reservationBikeId = draft.reservationBikeId;
        state.bikeStatus = draft.bikeStatus;
        return result;
      },
    };

    const layer = Layer.mergeAll(
      Layer.succeed(Prisma, Prisma.make({ client: client as never })),
      Layer.succeed(BikeRepository, BikeRepository.make({} as never)),
    );

    const summary = await runEffectWithLayer(
      assignFixedSlotReservations({ slotDate, assignmentTime: slotDate, now: slotDate }),
      layer,
    );

    expect(summary).toMatchObject({
      totalTemplates: 1,
      assigned: 0,
      conflicts: 1,
      noBike: 0,
      missingReservation: 0,
    });
    expect(state.reservationBikeId).toBeNull();
    expect(state.bikeStatus).toBe("AVAILABLE");
    expect(mocks.enqueueOutboxJobInTx).not.toHaveBeenCalled();
  });
});
