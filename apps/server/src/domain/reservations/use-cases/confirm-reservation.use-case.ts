import { Effect, Match, Option } from "effect";

import { BikeRepository } from "@/domain/bikes";
import { RentalRepository } from "@/domain/rentals";
import { Prisma } from "@/infrastructure/prisma";

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
    const bikeRepo = yield* BikeRepository;
    const rentalRepo = yield* RentalRepository;
    const now = input.now ?? new Date();

    type TxEither = import("effect").Either.Either<ReservationRow, ReservationServiceFailure>;

    const txEither = yield* Effect.tryPromise<TxEither, unknown>({
      try: () =>
        client.$transaction(async (tx) => {
          const eff: Effect.Effect<ReservationRow, ReservationServiceFailure, never> = Effect.gen(function* () {
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

            const bikeBooked = yield* bikeRepo.bookBikeIfReservedInTx(
              tx,
              bikeId,
              now,
            ).pipe(
              Effect.catchTag("BikeRepositoryError", err => Effect.die(err)),
            );
            if (!bikeBooked) {
              const bikeOpt = yield* bikeRepo.getByIdInTx(tx, bikeId).pipe(
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
          });

          return Effect.runPromise(eff.pipe(Effect.either)) as Promise<TxEither>;
        }),
      catch: err => err as unknown,
    }).pipe(
      Effect.catchAll(err => Effect.die(err)),
    );

    return yield* Match.value(txEither).pipe(
      Match.tag("Right", ({ right }) => Effect.succeed(right)),
      Match.tag("Left", ({ left }) => Effect.fail(left)),
      Match.exhaustive,
    );
  });
}
