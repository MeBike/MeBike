import { Effect, Option } from "effect";

import type { BikeRepository } from "@/domain/bikes";

import { makeBikeRepository } from "@/domain/bikes";
import { RentalRepository } from "@/domain/rentals";
import { Prisma } from "@/infrastructure/prisma";
import { runPrismaTransaction } from "@/lib/effect/prisma-tx";

import type { ReservationServiceFailure } from "../domain-errors";
import type { ReservationRow } from "../models";

import {
  BikeNotAvailable,
  BikeNotFound,
  ReservedRentalNotFound,
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
    const rentalRepo = yield* RentalRepository;
    const now = input.now ?? new Date();

    const reservation = yield* runPrismaTransaction(client, tx =>
      Effect.gen(function* () {
        const bikeRepo = makeBikeRepository(tx);
        const { reservation, bikeId } = yield* reservationService.confirmPendingInTx(
          tx,
          {
            reservationId: input.reservationId,
            userId: input.userId,
            now,
          },
        );

        const rentalStarted = yield* rentalRepo.startReservedRentalInTx(
          tx,
          reservation.id,
          now,
          now,
          reservation.subscriptionId ?? null,
        ).pipe(
          Effect.catchTag("RentalRepositoryError", err => Effect.die(err)),
        );
        if (!rentalStarted) {
          return yield* Effect.fail(new ReservedRentalNotFound({ reservationId: reservation.id }));
        }

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

        // TODO(iot): send booking "claim" command once IoT integration is ready.
        return reservation;
      })).pipe(
      Effect.catchTag("PrismaTransactionError", err => Effect.die(err)),
    );

    return reservation;
  });
}
