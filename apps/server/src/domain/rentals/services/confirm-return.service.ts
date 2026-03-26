import { Effect, Option } from "effect";

import { BikeRepository } from "@/domain/bikes";
import { Prisma } from "@/infrastructure/prisma";
import { runPrismaTransaction } from "@/lib/effect/prisma-tx";

import type { RentalServiceFailure } from "../domain-errors";
import type { RentalRow } from "../models";
import type { ConfirmRentalReturnInput } from "../types";

import {
  BikeNotFound,
  InvalidRentalState,
  RentalNotFound,
  ReturnAlreadyConfirmed,
  ReturnSlotRequiredForReturn,
  ReturnSlotStationMismatch,
} from "../domain-errors";
import { makeRentalRepository, RentalRepository } from "../repository/rental.repository";
import {
  makeReturnConfirmationRepository,
  ReturnConfirmationRepository,
} from "../repository/return-confirmation.repository";
import { makeReturnSlotRepository, ReturnSlotRepository } from "../repository/return-slot.repository";
import { finalizeRentalReturnInTx } from "./finalize-rental-return";

export function confirmRentalReturnByOperator(
  input: ConfirmRentalReturnInput,
): Effect.Effect<
  RentalRow,
  RentalServiceFailure,
  | Prisma
  | RentalRepository
  | ReturnSlotRepository
  | ReturnConfirmationRepository
  | BikeRepository
> {
  return Effect.gen(function* () {
    const { client } = yield* Prisma;
    yield* RentalRepository;
    yield* ReturnSlotRepository;
    yield* ReturnConfirmationRepository;
    yield* BikeRepository;

    return yield* runPrismaTransaction(
      client,
      tx =>
        Effect.gen(function* () {
          const txRentalRepo = makeRentalRepository(tx);
          const txReturnSlotRepo = makeReturnSlotRepository(tx);
          const txReturnConfirmationRepo = makeReturnConfirmationRepository(tx);

          const rentalOpt = yield* txRentalRepo.findById(input.rentalId).pipe(
            Effect.catchTag("RentalRepositoryError", err => Effect.die(err)),
          );

          if (Option.isNone(rentalOpt)) {
            return yield* Effect.fail(new RentalNotFound({
              rentalId: input.rentalId,
              userId: "unknown",
            }));
          }

          const rental = rentalOpt.value;
          if (rental.status !== "RENTED") {
            return yield* Effect.fail(new InvalidRentalState({
              rentalId: rental.id,
              from: rental.status,
              to: "COMPLETED",
            }));
          }

          if (!rental.bikeId) {
            return yield* Effect.fail(new BikeNotFound({ bikeId: "unknown" }));
          }

          const activeReturnSlotOpt = yield* txReturnSlotRepo.findActiveByRentalId(rental.id).pipe(
            Effect.catchTag("RentalRepositoryError", err => Effect.die(err)),
          );

          if (Option.isNone(activeReturnSlotOpt)) {
            return yield* Effect.fail(new ReturnSlotRequiredForReturn({
              rentalId: rental.id,
              endStationId: input.stationId,
            }));
          }

          const activeReturnSlot = activeReturnSlotOpt.value;
          if (activeReturnSlot.stationId !== input.stationId) {
            return yield* Effect.fail(new ReturnSlotStationMismatch({
              rentalId: rental.id,
              returnSlotStationId: activeReturnSlot.stationId,
              attemptedEndStationId: input.stationId,
            }));
          }

          const existingConfirmationOpt = yield* txReturnConfirmationRepo.findByRentalId(rental.id).pipe(
            Effect.catchTag("RentalRepositoryError", err => Effect.die(err)),
          );

          if (Option.isSome(existingConfirmationOpt)) {
            return yield* Effect.fail(new ReturnAlreadyConfirmed({
              rentalId: rental.id,
            }));
          }

          yield* txReturnConfirmationRepo.create({
            rentalId: rental.id,
            stationId: input.stationId,
            confirmedByUserId: input.confirmedByUserId,
            confirmationMethod: input.confirmationMethod,
            handoverStatus: "CONFIRMED",
            confirmedAt: input.confirmedAt,
          }).pipe(
            Effect.catchTag("ReturnConfirmationUniqueViolation", () =>
              Effect.fail(new ReturnAlreadyConfirmed({ rentalId: rental.id }))),
            Effect.catchTag("RentalRepositoryError", err => Effect.die(err)),
          );

          return yield* finalizeRentalReturnInTx({
            tx,
            rental,
            bikeId: rental.bikeId,
            endStationId: input.stationId,
            endTime: input.confirmedAt,
          });
        }),
    ).pipe(
      Effect.catchTag("PrismaTransactionError", err => Effect.die(err)),
    );
  });
}
