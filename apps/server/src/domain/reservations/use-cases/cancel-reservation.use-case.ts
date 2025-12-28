import { Effect, Match, Option } from "effect";

import { env } from "@/config/env";
import { BikeRepository } from "@/domain/bikes";
import { RentalRepository } from "@/domain/rentals";
import { WalletServiceTag } from "@/domain/wallets";
import { Prisma } from "@/infrastructure/prisma";
import logger from "@/lib/logger";

import type { ReservationServiceFailure } from "../domain-errors";
import type { ReservationRow } from "../models";

import { BikeNotAvailable, BikeNotFound } from "../domain-errors";
import { ReservationServiceTag } from "../services/reservation.service";

export type CancelReservationInput = {
  readonly reservationId: string;
  readonly userId: string;
  readonly now?: Date;
};

export function cancelReservationUseCase(
  input: CancelReservationInput,
): Effect.Effect<
  ReservationRow,
  ReservationServiceFailure,
  Prisma | ReservationServiceTag | BikeRepository | RentalRepository | WalletServiceTag
> {
  return Effect.gen(function* () {
    const { client } = yield* Prisma;
    const reservationService = yield* ReservationServiceTag;
    const bikeRepo = yield* BikeRepository;
    const rentalRepo = yield* RentalRepository;
    const walletService = yield* WalletServiceTag;
    const now = input.now ?? new Date();

    type TxEither = import("effect").Either.Either<ReservationRow, ReservationServiceFailure>;

    const txEither = yield* Effect.tryPromise<TxEither, unknown>({
      try: () =>
        client.$transaction(async (tx) => {
          const eff: Effect.Effect<ReservationRow, ReservationServiceFailure, never> = Effect.gen(function* () {
            const updatedReservation = yield* reservationService.cancelPendingInTx(
              tx,
              {
                reservationId: input.reservationId,
                userId: input.userId,
                now,
              },
            );

            yield* rentalRepo.cancelReservedRentalInTx(
              tx,
              updatedReservation.id,
              now,
            ).pipe(Effect.catchTag("RentalRepositoryError", err => Effect.die(err)));

            const bikeId = updatedReservation.bikeId;
            if (bikeId) {
              const bikeReleased = yield* bikeRepo.releaseBikeIfReservedInTx(
                tx,
                bikeId,
                now,
              ).pipe(
                Effect.catchTag("BikeRepositoryError", err => Effect.die(err)),
              );
              if (!bikeReleased) {
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
            }

            // TODO(iot): send reservation "cancel" command once IoT integration is ready.

            return updatedReservation;
          });

          return Effect.runPromise(eff.pipe(Effect.either)) as Promise<TxEither>;
        }),
      catch: err => err as unknown,
    }).pipe(
      Effect.catchAll(err => Effect.die(err)),
    );

    const reservation = yield* Match.value(txEither).pipe(
      Match.tag("Right", ({ right }) => Effect.succeed(right)),
      Match.tag("Left", ({ left }) => Effect.fail(left)),
      Match.exhaustive,
    );

    if (isRefundEligible(reservation, now)) {
      const refundHash = `refund:reservation:${reservation.id}`;
      const description = `Refund reservation ${reservation.id}`;

      yield* walletService.creditWallet({
        userId: reservation.userId,
        amount: reservation.prepaid,
        description,
        hash: refundHash,
        type: "REFUND",
      }).pipe(
        Effect.catchAll((err) => {
          logger.warn(
            { err, reservationId: reservation.id, userId: reservation.userId },
            "Reservation refund failed",
          );
          return Effect.succeed(undefined);
        }),
      );
    }

    return reservation;
  });
}

function isRefundEligible(reservation: ReservationRow, now: Date): boolean {
  if (reservation.reservationOption !== "ONE_TIME") {
    return false;
  }
  if (reservation.subscriptionId) {
    return false;
  }
  if (reservation.fixedSlotTemplateId) {
    return false;
  }
  const refundPeriodMs = env.REFUND_PERIOD_HOURS * 60 * 60 * 1000;
  return reservation.createdAt.getTime() + refundPeriodMs > now.getTime();
}
