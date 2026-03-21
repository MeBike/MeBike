import { Effect, Option } from "effect";

import type { BikeRepository } from "@/domain/bikes";

import { makeBikeRepository } from "@/domain/bikes";
import {
  makeRentalRepository,
  RentalRepository,
} from "@/domain/rentals";
import { rentalUniqueViolationToFailure } from "@/domain/rentals/services/unique-violation-mapper";
import { Prisma } from "@/infrastructure/prisma";
import { runPrismaTransaction } from "@/lib/effect/prisma-tx";

import type { ReservationServiceFailure } from "../domain-errors";
import type { ReservationRow } from "../models";

import {
  BikeNotAvailable,
  BikeNotFound,
  ReservationConfirmBlockedByActiveRental,
} from "../domain-errors";
import { ReservationServiceTag } from "../services/reservation.service";

export type ConfirmReservationInput = {
  readonly reservationId: string;
  readonly userId: string;
  readonly now?: Date;
};

export function confirmReservationUseCase(
  input: ConfirmReservationInput,
): Effect.Effect<
  ReservationRow,
  ReservationServiceFailure,
  Prisma | ReservationServiceTag | BikeRepository | RentalRepository
> {
  return Effect.gen(function* () {
    const { client } = yield* Prisma;
    const reservationService = yield* ReservationServiceTag;
    yield* RentalRepository;
    const now = input.now ?? new Date();

    const reservation = yield* runPrismaTransaction(client, tx =>
      Effect.gen(function* () {
        const txRentalRepo = makeRentalRepository(tx);
        const bikeRepo = makeBikeRepository(tx);
        const { reservation, bikeId } = yield* reservationService.confirmPendingInTx(
          tx,
          {
            reservationId: input.reservationId,
            userId: input.userId,
            now,
          },
        );

        const bikeBooked = yield* bikeRepo.bookBikeIfReserved(bikeId, now).pipe(
          Effect.catchTag("BikeRepositoryError", err => Effect.die(err)),
        );
        if (!bikeBooked) {
          const bikeOpt = yield* bikeRepo.getById(bikeId).pipe(
            Effect.catchTag("BikeRepositoryError", err => Effect.die(err)),
          );
          if (Option.isNone(bikeOpt)) {
            return yield* Effect.fail(new BikeNotFound({ bikeId }));
          }
          return yield* Effect.fail(new BikeNotAvailable({
            bikeId,
            status: bikeOpt.value.status,
          }));
        }

        yield* txRentalRepo.createRental({
          userId: input.userId,
          reservationId: reservation.id,
          bikeId,
          startStationId: reservation.stationId,
          startTime: now,
          subscriptionId: reservation.subscriptionId ?? null,
        }).pipe(
          Effect.catchTag("RentalUniqueViolation", ({ constraint }) => {
            const mapped = rentalUniqueViolationToFailure({
              constraint,
              bikeId,
              userId: input.userId,
            });

            if (Option.isNone(mapped)) {
              return Effect.die(new Error(
                `Unhandled rental unique constraint while confirming reservation: ${String(constraint)}`,
              ));
            }

            if (mapped.value._tag === "ActiveRentalExists") {
              return Effect.fail(new ReservationConfirmBlockedByActiveRental({ userId: input.userId }));
            }

            return Effect.die(new Error(
              `Invariant violated: bike ${bikeId} should not be concurrently rented while confirming reservation ${reservation.id}`,
            ));
          }),
          Effect.catchTag("RentalRepositoryError", err => Effect.die(err)),
        );

        const updatedReservation = yield* reservationService.updateStatus({
          reservationId: reservation.id,
          status: "FULFILLED",
          updatedAt: now,
        }).pipe(
          Effect.catchTag("ReservationNotFound", err => Effect.die(err)),
        );

        // TODO(iot): send booking "claim" command once IoT integration is ready.
        return updatedReservation;
      })).pipe(
      Effect.catchTag("PrismaTransactionError", err => Effect.die(err)),
    );

    return reservation;
  });
}
