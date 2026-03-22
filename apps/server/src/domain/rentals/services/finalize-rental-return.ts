import { Effect, Option } from "effect";

import type { WalletBalanceConstraint } from "@/domain/wallets/domain-errors";
import type { DecreaseBalanceInput } from "@/domain/wallets/models";
import type { Prisma as PrismaTypes } from "generated/prisma/client";

import { env } from "@/config/env";
import { makeBikeRepository } from "@/domain/bikes";
import { makeReservationRepository } from "@/domain/reservations/repository/reservation.repository";
import { toMinorUnit } from "@/domain/shared/money";
import {
  SubscriptionNotFound,
  SubscriptionUsageExceeded,
} from "@/domain/subscriptions/domain-errors";
import { makeSubscriptionRepository } from "@/domain/subscriptions/repository/subscription.repository";
import { makeWalletRepository } from "@/domain/wallets";

import type { RentalServiceFailure } from "../domain-errors";
import type { RentalRow } from "../models";

import {
  BikeNotFound,
  InsufficientBalanceToRent,
  ReturnSlotRequiredForReturn,
  UserWalletNotFound,
} from "../domain-errors";
import { computeSubscriptionCoverage } from "../pricing";
import { makeRentalRepository } from "../repository/rental.repository";
import { makeReturnSlotRepository } from "../repository/return-slot.repository";

type FinalizeRentalReturnInput = {
  tx: PrismaTypes.TransactionClient;
  rental: RentalRow;
  bikeId: string;
  endStationId: string;
  endTime: Date;
};

export function finalizeRentalReturnInTx(
  input: FinalizeRentalReturnInput,
): Effect.Effect<RentalRow, RentalServiceFailure> {
  return Effect.gen(function* () {
    const { tx, rental, bikeId, endStationId, endTime } = input;
    const txBikeRepo = makeBikeRepository(tx);
    const txRentalRepo = makeRentalRepository(tx);
    const txReturnSlotRepo = makeReturnSlotRepository(tx);

    const durationMinutes = Math.max(
      1,
      Math.floor((endTime.getTime() - new Date(rental.startTime).getTime()) / 60000),
    );

    let basePrice = Math.ceil(durationMinutes / 30) * env.PRICE_PER_30_MINS;
    const durationHours = durationMinutes / 60;
    let usageToAdd = 0;
    let prepaidMinor = 0n;

    const txReservationRepo = makeReservationRepository(tx);
    const reservationOpt = rental.reservationId
      ? yield* txReservationRepo.findById(rental.reservationId).pipe(
        Effect.catchTag("ReservationRepositoryError", err => Effect.die(err)),
      )
      : Option.none();
    if (Option.isSome(reservationOpt)) {
      prepaidMinor = toMinorUnit(reservationOpt.value.prepaid);
    }

    if (rental.subscriptionId) {
      const txSubscriptionRepo = makeSubscriptionRepository(tx);

      const subscriptionOpt = yield* txSubscriptionRepo.findById(rental.subscriptionId).pipe(
        Effect.catchTag("SubscriptionRepositoryError", err => Effect.die(err)),
      );

      if (Option.isNone(subscriptionOpt)) {
        return yield* Effect.fail(new SubscriptionNotFound({
          subscriptionId: rental.subscriptionId,
        }));
      }

      const subscription = subscriptionOpt.value;
      const coverage = yield* computeSubscriptionCoverage({
        durationMinutes,
        subscription,
        userId: rental.userId,
      });
      basePrice = coverage.basePrice;
      usageToAdd = coverage.usageToAdd;

      if (usageToAdd > 0) {
        const incremented = yield* txSubscriptionRepo.incrementUsage(
          subscription.id,
          subscription.usageCount,
          usageToAdd,
          ["ACTIVE", "PENDING"],
        ).pipe(
          Effect.catchTag("SubscriptionRepositoryError", err => Effect.die(err)),
        );

        if (Option.isNone(incremented)) {
          return yield* Effect.fail(new SubscriptionUsageExceeded({
            subscriptionId: subscription.id,
            usageCount: subscription.usageCount,
            maxUsages: subscription.maxUsages ?? subscription.usageCount,
          }));
        }
      }
    }

    const penaltyAmount = durationHours > env.RENTAL_PENALTY_HOURS
      ? env.RENTAL_PENALTY_AMOUNT
      : 0;
    const totalPrice = Math.max(
      0,
      basePrice + penaltyAmount - Number(prepaidMinor),
    );

    if (totalPrice > 0) {
      yield* debitWallet(makeWalletRepository(tx), {
        userId: rental.userId,
        amount: BigInt(totalPrice),
        description: `Rental ${rental.id}`,
        hash: `rental:${rental.id}`,
        type: "DEBIT",
      });
    }

    const updatedBike = yield* txBikeRepo.updateStatusAndStationAt(
      bikeId,
      "AVAILABLE",
      endStationId,
      endTime,
    ).pipe(
      Effect.catchTag("BikeRepositoryError", err => Effect.die(err)),
    );
    if (Option.isNone(updatedBike)) {
      return yield* Effect.fail(new BikeNotFound({ bikeId }));
    }

    const finalizedReturnSlot = yield* txReturnSlotRepo.finalizeActiveByRentalId(
      rental.id,
      "USED",
      endTime,
    ).pipe(
      Effect.catchTag("RentalRepositoryError", err => Effect.die(err)),
    );
    if (Option.isNone(finalizedReturnSlot)) {
      return yield* Effect.fail(new ReturnSlotRequiredForReturn({
        rentalId: rental.id,
        endStationId,
      }));
    }

    const updatedRental = yield* txRentalRepo.updateRentalOnEnd({
      rentalId: rental.id,
      endStationId,
      endTime,
      durationMinutes,
      totalPrice,
      newStatus: "COMPLETED",
    }).pipe(
      Effect.catchTag("RentalRepositoryError", err => Effect.die(err)),
    );

    if (Option.isNone(updatedRental)) {
      return yield* Effect.die(new Error(
        `Expected rental ${rental.id} to remain completable during return finalization`,
      ));
    }

    return updatedRental.value;
  });
}

function debitWallet(
  repo: ReturnType<typeof makeWalletRepository>,
  input: DecreaseBalanceInput,
) {
  return repo.decreaseBalance(input).pipe(
    Effect.catchTag("WalletRecordNotFound", () =>
      Effect.fail(new UserWalletNotFound({ userId: input.userId }))),
    Effect.catchTag("WalletBalanceConstraint", (err: WalletBalanceConstraint) =>
      Effect.fail(new InsufficientBalanceToRent({
        userId: err.userId,
        requiredBalance: Number(err.attemptedDebit),
        currentBalance: Number(err.balance),
      }))),
    Effect.catchTag("WalletRepositoryError", err => Effect.die(err)),
  );
}
