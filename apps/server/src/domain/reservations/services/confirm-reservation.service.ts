import { Effect, Option } from "effect";

import type { BikeRepository } from "@/domain/bikes";

import { makeBikeRepository } from "@/domain/bikes";
import { makePricingPolicyRepository } from "@/domain/pricing";
import {
  makeRentalRepository,
  RentalRepository,
} from "@/domain/rentals";
import { rentalUniqueViolationToFailure } from "@/domain/rentals/services/unique-violation-mapper";
import { toMinorUnit } from "@/domain/shared/money";
import { makeWalletRepository } from "@/domain/wallets";
import { InsufficientWalletBalance, WalletNotFound } from "@/domain/wallets/domain-errors";
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

export function confirmReservation(
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
        const txPricingPolicyRepo = makePricingPolicyRepository(tx);
        const txWalletRepo = makeWalletRepository(tx);
        const { reservation, bikeId } = yield* reservationService.validatePendingForConfirmationInTx(
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

        const pricingPolicyId = reservation.pricingPolicyId
          ?? (yield* txPricingPolicyRepo.getActive().pipe(
            Effect.catchTag("PricingPolicyRepositoryError", err => Effect.die(err)),
            Effect.catchTag("ActivePricingPolicyNotFound", err => Effect.die(err)),
            Effect.catchTag("ActivePricingPolicyAmbiguous", err => Effect.die(err)),
            Effect.map(policy => policy.id),
          ));
        const pricingPolicy = yield* txPricingPolicyRepo.getById(pricingPolicyId).pipe(
          Effect.catchTag("PricingPolicyRepositoryError", err => Effect.die(err)),
          Effect.catchTag("PricingPolicyNotFound", err => Effect.die(err)),
        );

        const walletOpt = yield* txWalletRepo.findByUserId(input.userId).pipe(
          Effect.catchTag("WalletRepositoryError", err => Effect.die(err)),
        );
        if (Option.isNone(walletOpt)) {
          return yield* Effect.fail(new WalletNotFound({ userId: input.userId }));
        }

        const requiredBalance = toMinorUnit(pricingPolicy.depositRequired);
        if (walletOpt.value.balance < requiredBalance) {
          return yield* Effect.fail(new InsufficientWalletBalance({
            walletId: walletOpt.value.id,
            userId: input.userId,
            balance: walletOpt.value.balance,
            attemptedDebit: requiredBalance,
          }));
        }

        yield* txRentalRepo.createRental({
          userId: input.userId,
          reservationId: reservation.id,
          bikeId,
          pricingPolicyId,
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
