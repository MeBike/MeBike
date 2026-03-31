import { Effect, Option } from "effect";

import type { BikeRepository } from "@/domain/bikes";

import { makeBikeRepository } from "@/domain/bikes";
import { BikeRepositoryError } from "@/domain/bikes/domain-errors";
import { makePricingPolicyRepository } from "@/domain/pricing";
import { PricingPolicyRepositoryError } from "@/domain/pricing/domain-errors";
import {
  makeRentalRepository,
  RentalRepository,
} from "@/domain/rentals";
import { RentalRepositoryError } from "@/domain/rentals/domain-errors";
import { createRentalDepositHoldInTx } from "@/domain/rentals/services/rental-deposit-hold.service";
import { rentalUniqueViolationToFailure } from "@/domain/rentals/services/unique-violation-mapper";
import { defectOn } from "@/domain/shared";
import { toMinorUnit } from "@/domain/shared/money";
import { WalletHoldRepositoryError, WalletRepositoryError } from "@/domain/wallets/domain-errors";
import { Prisma } from "@/infrastructure/prisma";
import { PrismaTransactionError, runPrismaTransaction } from "@/lib/effect/prisma-tx";

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
        const { reservation, bikeId } = yield* reservationService.validatePendingForConfirmationInTx(
          tx,
          {
            reservationId: input.reservationId,
            userId: input.userId,
            now,
          },
        );

        const bikeBooked = yield* bikeRepo.bookBikeIfReserved(bikeId, now).pipe(
          defectOn(BikeRepositoryError),
        );
        if (!bikeBooked) {
          const bikeOpt = yield* bikeRepo.getById(bikeId).pipe(
            defectOn(BikeRepositoryError),
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
            defectOn(PricingPolicyRepositoryError),
            Effect.catchTag("ActivePricingPolicyNotFound", err => Effect.die(err)),
            Effect.catchTag("ActivePricingPolicyAmbiguous", err => Effect.die(err)),
            Effect.map(policy => policy.id),
          ));
        const pricingPolicy = yield* txPricingPolicyRepo.getById(pricingPolicyId).pipe(
          defectOn(PricingPolicyRepositoryError),
          Effect.catchTag("PricingPolicyNotFound", err => Effect.die(err)),
        );

        const requiredBalance = toMinorUnit(pricingPolicy.depositRequired);
        const createdRental = yield* txRentalRepo.createRental({
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
          defectOn(RentalRepositoryError),
        );

        yield* createRentalDepositHoldInTx({
          tx,
          rentalId: createdRental.id,
          userId: input.userId,
          amount: requiredBalance,
        }).pipe(
          Effect.catchTag("WalletNotFound", err => Effect.fail(err)),
          Effect.catchTag("InsufficientWalletBalance", err => Effect.fail(err)),
          defectOn(WalletRepositoryError),
          defectOn(WalletHoldRepositoryError),
          defectOn(RentalRepositoryError),
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
      defectOn(PrismaTransactionError),
    );

    return reservation;
  });
}
