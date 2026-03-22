import { Effect, Option } from "effect";

import { StationNotFound } from "@/domain/stations";
import { Prisma } from "@/infrastructure/prisma";
import { runPrismaTransaction } from "@/lib/effect/prisma-tx";

import type { ReturnSlotRow } from "../models";

import {
  RentalNotFound,
  ReturnSlotCapacityExceeded,
  ReturnSlotNotFound,
  ReturnSlotRequiresActiveRental,
} from "../domain-errors";
import { makeRentalRepository, RentalRepository } from "../repository/rental.repository";
import {
  makeReturnSlotRepository,
  ReturnSlotRepository,
} from "../repository/return-slot.repository";

export type ReturnSlotFailure
  = | RentalNotFound
    | ReturnSlotRequiresActiveRental
    | ReturnSlotNotFound
    | ReturnSlotCapacityExceeded
    | StationNotFound;

type ReturnSlotInput = {
  rentalId: string;
  userId: string;
  stationId: string;
  now?: Date;
};

type RentalScopedInput = {
  rentalId: string;
  userId: string;
  now?: Date;
};

function availableReturnSlots(capacity: number, totalBikes: number, activeReturnSlots: number) {
  return capacity - totalBikes - activeReturnSlots;
}

export function createReturnSlot(
  input: ReturnSlotInput,
): Effect.Effect<
  ReturnSlotRow,
  ReturnSlotFailure,
  Prisma | RentalRepository | ReturnSlotRepository
> {
  return Effect.gen(function* () {
    const { client } = yield* Prisma;
    yield* RentalRepository;
    yield* ReturnSlotRepository;
    const now = input.now ?? new Date();

    return yield* runPrismaTransaction(client, tx =>
      Effect.gen(function* () {
        const rentalRepo = makeRentalRepository(tx);
        const returnSlotRepo = makeReturnSlotRepository(tx);

        const rentalOpt = yield* rentalRepo.getMyRentalById(input.userId, input.rentalId).pipe(
          Effect.catchTag("RentalRepositoryError", err => Effect.die(err)),
        );

        if (Option.isNone(rentalOpt)) {
          return yield* Effect.fail(new RentalNotFound({
            rentalId: input.rentalId,
            userId: input.userId,
          }));
        }

        const rental = rentalOpt.value;
        if (rental.status !== "RENTED") {
          return yield* Effect.fail(new ReturnSlotRequiresActiveRental({
            rentalId: rental.id,
            status: rental.status,
          }));
        }

        const existing = yield* returnSlotRepo.findActiveByRentalId(input.rentalId).pipe(
          Effect.catchTag("RentalRepositoryError", err => Effect.die(err)),
        );

        if (Option.isSome(existing) && existing.value.stationId === input.stationId) {
          return existing.value;
        }

        const stationSnapshotOpt = yield* returnSlotRepo.getStationCapacitySnapshot(input.stationId).pipe(
          Effect.catchTag("RentalRepositoryError", err => Effect.die(err)),
        );

        if (Option.isNone(stationSnapshotOpt)) {
          return yield* Effect.fail(new StationNotFound({ id: input.stationId }));
        }

        const stationSnapshot = stationSnapshotOpt.value;
        if (availableReturnSlots(
          stationSnapshot.capacity,
          stationSnapshot.totalBikes,
          stationSnapshot.activeReturnSlots,
        ) <= 0) {
          return yield* Effect.fail(new ReturnSlotCapacityExceeded({
            stationId: input.stationId,
            capacity: stationSnapshot.capacity,
            totalBikes: stationSnapshot.totalBikes,
            activeReturnSlots: stationSnapshot.activeReturnSlots,
          }));
        }

        if (Option.isSome(existing)) {
          yield* returnSlotRepo.cancelActiveByRentalId(input.rentalId, now).pipe(
            Effect.catchTag("RentalRepositoryError", err => Effect.die(err)),
          );
        }

        return yield* returnSlotRepo.createActive({
          rentalId: input.rentalId,
          userId: input.userId,
          stationId: input.stationId,
          reservedFrom: now,
        }).pipe(
          Effect.catchTag("ReturnSlotUniqueViolation", () =>
            returnSlotRepo.findActiveByRentalId(input.rentalId).pipe(
              Effect.catchTag("RentalRepositoryError", err => Effect.die(err)),
              Effect.flatMap(activeOpt =>
                Option.isSome(activeOpt)
                  ? Effect.succeed(activeOpt.value)
                  // This is still treated as a defect on purpose: once we hit the known
                  // one-active-return-slot-per-rental unique constraint, rereading that
                  // active slot should always succeed. We do not have a meaningful recovery
                  // path here yet, so surfacing it as a typed domain error would only add
                  // noise without changing runtime behavior.
                  : Effect.die(new Error(
                      `Active return slot unique violation without persisted slot for rental ${input.rentalId}`,
                    )),
              ),
            )),
          Effect.catchTag("RentalRepositoryError", err => Effect.die(err)),
        );
      })).pipe(
      Effect.catchTag("PrismaTransactionError", err => Effect.die(err)),
    );
  });
}

export function getCurrentReturnSlot(
  input: RentalScopedInput,
): Effect.Effect<
  Option.Option<ReturnSlotRow>,
  RentalNotFound | ReturnSlotRequiresActiveRental,
  RentalRepository | ReturnSlotRepository
> {
  return Effect.gen(function* () {
    const rentalRepo = yield* RentalRepository;
    const returnSlotRepo = yield* ReturnSlotRepository;

    const rentalOpt = yield* rentalRepo.getMyRentalById(input.userId, input.rentalId).pipe(
      Effect.catchTag("RentalRepositoryError", err => Effect.die(err)),
    );

    if (Option.isNone(rentalOpt)) {
      return yield* Effect.fail(new RentalNotFound({
        rentalId: input.rentalId,
        userId: input.userId,
      }));
    }

    const rental = rentalOpt.value;
    if (rental.status !== "RENTED") {
      return yield* Effect.fail(new ReturnSlotRequiresActiveRental({
        rentalId: rental.id,
        status: rental.status,
      }));
    }

    return yield* returnSlotRepo.findActiveByRentalId(input.rentalId).pipe(
      Effect.catchTag("RentalRepositoryError", err => Effect.die(err)),
    );
  });
}

export function cancelReturnSlot(
  input: RentalScopedInput,
): Effect.Effect<
  ReturnSlotRow,
  RentalNotFound | ReturnSlotRequiresActiveRental | ReturnSlotNotFound,
  Prisma | RentalRepository | ReturnSlotRepository
> {
  return Effect.gen(function* () {
    const { client } = yield* Prisma;
    yield* RentalRepository;
    yield* ReturnSlotRepository;
    const now = input.now ?? new Date();

    return yield* runPrismaTransaction(client, tx =>
      Effect.gen(function* () {
        const rentalRepo = makeRentalRepository(tx);
        const returnSlotRepo = makeReturnSlotRepository(tx);

        const rentalOpt = yield* rentalRepo.getMyRentalById(input.userId, input.rentalId).pipe(
          Effect.catchTag("RentalRepositoryError", err => Effect.die(err)),
        );

        if (Option.isNone(rentalOpt)) {
          return yield* Effect.fail(new RentalNotFound({
            rentalId: input.rentalId,
            userId: input.userId,
          }));
        }

        const rental = rentalOpt.value;
        if (rental.status !== "RENTED") {
          return yield* Effect.fail(new ReturnSlotRequiresActiveRental({
            rentalId: rental.id,
            status: rental.status,
          }));
        }

        const cancelled = yield* returnSlotRepo.cancelActiveByRentalId(input.rentalId, now).pipe(
          Effect.catchTag("RentalRepositoryError", err => Effect.die(err)),
        );

        if (Option.isNone(cancelled)) {
          return yield* Effect.fail(new ReturnSlotNotFound({
            rentalId: input.rentalId,
            userId: input.userId,
          }));
        }

        return cancelled.value;
      })).pipe(
      Effect.catchTag("PrismaTransactionError", err => Effect.die(err)),
    );
  });
}
