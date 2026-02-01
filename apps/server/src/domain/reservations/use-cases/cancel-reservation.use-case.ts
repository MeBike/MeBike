import { Effect, Option } from "effect";

import type { BikeRepository } from "@/domain/bikes";

import { env } from "@/config/env";
import { makeBikeRepository } from "@/domain/bikes";
import { RentalRepository } from "@/domain/rentals";
import { toMinorUnit } from "@/domain/shared/money";
import { WalletServiceTag } from "@/domain/wallets";
import { Prisma } from "@/infrastructure/prisma";
import { runPrismaTransaction } from "@/lib/effect/prisma-tx";
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
    const rentalRepo = yield* RentalRepository;
    const walletService = yield* WalletServiceTag;
    const now = input.now ?? new Date();

    const reservation = yield* runPrismaTransaction(client, tx =>
      Effect.gen(function* () {
        const bikeRepo = makeBikeRepository(tx);
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
          const bikeReleased = yield* bikeRepo.releaseBikeIfReserved(bikeId, now).pipe(
            Effect.catchTag("BikeRepositoryError", err => Effect.die(err)),
          );
          if (!bikeReleased) {
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
        }

        // TODO(iot): send reservation "cancel" command once IoT integration is ready.

        return updatedReservation;
      })).pipe(
      Effect.catchTag("PrismaTransactionError", err => Effect.die(err)),
    );

    if (isRefundEligible(reservation, now)) {
      const refundHash = `refund:reservation:${reservation.id}`;
      const description = `Refund reservation ${reservation.id}`;
      const amount = toMinorUnit(reservation.prepaid);

      yield* walletService.creditWallet({
        userId: reservation.userId,
        amount,
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
