import { Effect, Layer, Option } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
  reservationId: string | null;
  bikeStatus: "AVAILABLE" | "RESERVED";
};

describe("assignFixedSlotReservations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.enqueueOutboxJobInTx.mockImplementation(() => Effect.void);
  });

  it("creates and assigns daily fixed-slot reservation when bike is available", async () => {
    const slotDate = new Date(Date.UTC(2026, 3, 14));
    const slotStart = new Date(Date.UTC(2000, 0, 1, 9, 0, 0));
    const createdReservation = { id: "reservation-1", bikeId: null };
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
      reservationId: null,
      bikeStatus: "AVAILABLE",
    };

    mocks.makeReservationQueryRepository.mockImplementation((client: { state?: DraftState }) => {
      if (client.state) {
        return {
          findPendingFixedSlotByTemplateAndStart: () => Effect.succeed(
            client.state!.reservationId === null
              ? Option.none()
              : Option.some({ id: client.state!.reservationId, bikeId: "bike-1" }),
          ),
        };
      }

      return {
        listActiveFixedSlotTemplatesByDate: () => Effect.succeed([template]),
      };
    });

    mocks.makeReservationCommandRepository.mockImplementation((tx: { state: DraftState }) => ({
      createReservation: ({ bikeId }: { bikeId?: string | null }) => Effect.sync(() => {
        tx.state.reservationId = createdReservation.id;
        return { ...createdReservation, bikeId: bikeId ?? null };
      }),
      assignBikeToPendingReservation: vi.fn(),
    }));

    mocks.makeBikeRepository.mockImplementation((tx: { state: DraftState }) => ({
      findAvailableByStation: () => Effect.succeed(
        tx.state.bikeStatus === "AVAILABLE" ? Option.some(bike) : Option.none(),
      ),
      reserveBikeIfAvailable: () => Effect.sync(() => {
        if (tx.state.bikeStatus !== "AVAILABLE") {
          return false;
        }
        tx.state.bikeStatus = "RESERVED";
        return true;
      }),
    }));

    const client = {
      $transaction: async <T>(callback: (tx: { state: DraftState }) => Promise<T>) => {
        const draft: DraftState = { ...state };
        const result = await callback({ state: draft });
        state.reservationId = draft.reservationId;
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
      assigned: 1,
      alreadyAssigned: 0,
      conflicts: 0,
      noBike: 0,
    });
    expect(state.reservationId).toBe(createdReservation.id);
    expect(state.bikeStatus).toBe("RESERVED");
    expect(mocks.enqueueOutboxJobInTx).toHaveBeenCalledTimes(1);
  });

  it("skips duplicate creation when day reservation already assigned", async () => {
    const slotDate = new Date(Date.UTC(2026, 3, 14));
    const slotStart = new Date(Date.UTC(2000, 0, 1, 9, 0, 0));
    const template = {
      id: "template-1",
      userId: "user-1",
      stationId: "station-1",
      slotStart,
      user: { fullName: "Test User", email: "user@example.com" },
      station: { name: "Test Station" },
    };

    mocks.makeReservationQueryRepository.mockImplementation((client: { state?: DraftState }) => {
      if (client.state) {
        return {
          findPendingFixedSlotByTemplateAndStart: () => Effect.succeed(
            Option.some({ id: "reservation-1", bikeId: "bike-1" }),
          ),
        };
      }

      return {
        listActiveFixedSlotTemplatesByDate: () => Effect.succeed([template]),
      };
    });

    mocks.makeReservationCommandRepository.mockReturnValue({
      createReservation: vi.fn(),
      assignBikeToPendingReservation: vi.fn(),
    });
    mocks.makeBikeRepository.mockReturnValue({
      findAvailableByStation: vi.fn(),
      reserveBikeIfAvailable: vi.fn(),
    });

    const client = {
      $transaction: async <T>(callback: (tx: { state: DraftState }) => Promise<T>) =>
        callback({
          state: {
            reservationId: "reservation-1",
            bikeStatus: "RESERVED",
          },
        }),
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
      alreadyAssigned: 1,
      conflicts: 0,
      noBike: 0,
    });
    expect(mocks.enqueueOutboxJobInTx).not.toHaveBeenCalled();
  });

  it("does not create daily reservation when bike reserve step conflicts", async () => {
    const slotDate = new Date(Date.UTC(2026, 3, 14));
    const slotStart = new Date(Date.UTC(2000, 0, 1, 9, 0, 0));
    const reservation = { id: "reservation-1", bikeId: null };
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
      reservationId: null,
      bikeStatus: "AVAILABLE",
    };

    mocks.makeReservationQueryRepository.mockImplementation((client: { state?: DraftState }) => {
      if (client.state) {
        return {
          findPendingFixedSlotByTemplateAndStart: () => Effect.succeed(
            client.state!.reservationId === null
              ? Option.none()
              : Option.some({ id: reservation.id, bikeId: "bike-1" }),
          ),
        };
      }

      return {
        listActiveFixedSlotTemplatesByDate: () => Effect.succeed([template]),
      };
    });

    mocks.makeReservationCommandRepository.mockImplementation((tx: { state: DraftState }) => ({
      createReservation: ({ bikeId }: { bikeId?: string | null }) => Effect.sync(() => {
        tx.state.reservationId = reservation.id;
        return { ...reservation, bikeId: bikeId ?? null };
      }),
      assignBikeToPendingReservation: vi.fn(),
    }));

    mocks.makeBikeRepository.mockImplementation((tx: { state: DraftState }) => ({
      findAvailableByStation: () => Effect.succeed(
        tx.state.bikeStatus === "AVAILABLE" ? Option.some(bike) : Option.none(),
      ),
      reserveBikeIfAvailable: () => Effect.succeed(false),
    }));

    const client = {
      $transaction: async <T>(callback: (tx: { state: DraftState }) => Promise<T>) => {
        const draft: DraftState = { ...state };
        const result = await callback({ state: draft });
        state.reservationId = draft.reservationId;
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
      alreadyAssigned: 0,
      conflicts: 1,
      noBike: 0,
    });
    expect(state.reservationId).toBeNull();
    expect(state.bikeStatus).toBe("AVAILABLE");
    expect(mocks.enqueueOutboxJobInTx).not.toHaveBeenCalled();
  });

  it("treats old unassigned fixed-slot reservation as conflict", async () => {
    const slotDate = new Date(Date.UTC(2026, 3, 14));
    const slotStart = new Date(Date.UTC(2000, 0, 1, 9, 0, 0));
    const template = {
      id: "template-1",
      userId: "user-1",
      stationId: "station-1",
      slotStart,
      user: { fullName: "Test User", email: "user@example.com" },
      station: { name: "Test Station" },
    };

    mocks.makeReservationQueryRepository.mockImplementation((client: { state?: DraftState }) => {
      if (client.state) {
        return {
          findPendingFixedSlotByTemplateAndStart: () => Effect.succeed(
            Option.some({ id: "reservation-1", bikeId: null }),
          ),
        };
      }

      return {
        listActiveFixedSlotTemplatesByDate: () => Effect.succeed([template]),
      };
    });
    mocks.makeReservationCommandRepository.mockReturnValue({
      createReservation: vi.fn(),
      assignBikeToPendingReservation: vi.fn(),
    });
    mocks.makeBikeRepository.mockReturnValue({
      findAvailableByStation: vi.fn(),
      reserveBikeIfAvailable: vi.fn(),
    });

    const client = {
      $transaction: async <T>(callback: (tx: { state: DraftState }) => Promise<T>) =>
        callback({
          state: {
            reservationId: "reservation-1",
            bikeStatus: "AVAILABLE",
          },
        }),
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
      alreadyAssigned: 0,
      noBike: 0,
      conflicts: 1,
    });
    expect(mocks.enqueueOutboxJobInTx).not.toHaveBeenCalled();
  });
});
