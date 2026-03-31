import { Effect, Option } from "effect";

import type { WalletBalanceConstraint } from "@/domain/wallets/domain-errors";
import type { DecreaseBalanceInput } from "@/domain/wallets/models";
import type { Prisma as PrismaTypes } from "generated/prisma/client";

import { makeBikeRepository } from "@/domain/bikes";
import {
  calculateUsageChargeMinor,
  isAfterLateReturnCutoff,
  makePricingPolicyRepository,
} from "@/domain/pricing";
import { PricingPolicyRepositoryError } from "@/domain/pricing/domain-errors";
import { RentalRepositoryError } from "@/domain/rentals/domain-errors";
import { ReservationRepositoryError } from "@/domain/reservations/domain-errors";
import { makeReservationRepository } from "@/domain/reservations/repository/reservation.repository";
import { defectOn } from "@/domain/shared";
import { toPrismaDecimal } from "@/domain/shared/decimal";
import { toMinorUnit } from "@/domain/shared/money";
import { SubscriptionNotFound, SubscriptionRepositoryError, SubscriptionUsageExceeded } from "@/domain/subscriptions/domain-errors";
import { makeSubscriptionRepository } from "@/domain/subscriptions/repository/subscription.repository";
import { makeWalletRepository } from "@/domain/wallets";
import { WalletHoldRepositoryError, WalletRepositoryError } from "@/domain/wallets/domain-errors";

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
import {
  forfeitRentalDepositHoldInTx,
  releaseRentalDepositHoldInTx,
} from "./rental-deposit-hold.service";

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
    const txPricingPolicyRepo = makePricingPolicyRepository(tx);
    const txReturnSlotRepo = makeReturnSlotRepository(tx);

    const durationMinutes = Math.max(
      1,
      Math.floor((endTime.getTime() - new Date(rental.startTime).getTime()) / 60000),
    );

    const pricingPolicy = rental.pricingPolicyId
      ? (yield* txPricingPolicyRepo.getById(rental.pricingPolicyId).pipe(
          defectOn(PricingPolicyRepositoryError),
          Effect.catchTag("PricingPolicyNotFound", err => Effect.die(err)),
        ))
      : (yield* txPricingPolicyRepo.getActive().pipe(
          defectOn(PricingPolicyRepositoryError),
          Effect.catchTag("ActivePricingPolicyNotFound", err => Effect.die(err)),
          Effect.catchTag("ActivePricingPolicyAmbiguous", err => Effect.die(err)),
        ));

    const fullBaseAmountMinor = calculateUsageChargeMinor({
      durationMinutes,
      policy: pricingPolicy,
    });
    let basePriceMinor = fullBaseAmountMinor;
    let usageToAdd = 0;
    let prepaidMinor = 0n;
    let subscriptionDiscountMinor = 0n;

    const txReservationRepo = makeReservationRepository(tx);
    const reservationOpt = rental.reservationId
      ? yield* txReservationRepo.findById(rental.reservationId).pipe(
        defectOn(ReservationRepositoryError),
      )
      : Option.none();
    if (Option.isSome(reservationOpt)) {
      prepaidMinor = toMinorUnit(reservationOpt.value.prepaid);
    }

    if (rental.subscriptionId) {
      const txSubscriptionRepo = makeSubscriptionRepository(tx);

      const subscriptionOpt = yield* txSubscriptionRepo.findById(rental.subscriptionId).pipe(
        defectOn(SubscriptionRepositoryError),
      );

      if (Option.isNone(subscriptionOpt)) {
        return yield* Effect.fail(new SubscriptionNotFound({
          subscriptionId: rental.subscriptionId,
        }));
      }

      const subscription = subscriptionOpt.value;
      const coverage = yield* computeSubscriptionCoverage({
        durationMinutes,
        pricingPolicy,
        subscription,
        userId: rental.userId,
      });
      basePriceMinor = coverage.basePriceMinor;
      subscriptionDiscountMinor = coverage.subscriptionDiscountMinor;
      usageToAdd = coverage.usageToAdd;

      if (usageToAdd > 0) {
        const incremented = yield* txSubscriptionRepo.incrementUsage(
          subscription.id,
          subscription.usageCount,
          usageToAdd,
          ["ACTIVE", "PENDING"],
        ).pipe(
          defectOn(SubscriptionRepositoryError),
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

    const totalPriceMinor = basePriceMinor > prepaidMinor
      ? basePriceMinor - prepaidMinor
      : 0n;

    const depositForfeited = Boolean(rental.depositHoldId)
      && isAfterLateReturnCutoff(endTime, pricingPolicy.lateReturnCutoff);

    if (rental.depositHoldId) {
      const depositHandled = depositForfeited
        ? yield* forfeitRentalDepositHoldInTx({
          tx,
          holdId: rental.depositHoldId,
          userId: rental.userId,
          rentalId: rental.id,
          forfeitedAt: endTime,
        }).pipe(
          Effect.catchTag("WalletNotFound", err => Effect.die(err)),
          Effect.catchTag("InsufficientWalletBalance", err => Effect.die(err)),
          defectOn(WalletRepositoryError, WalletHoldRepositoryError),
        )
        : yield* releaseRentalDepositHoldInTx({
          tx,
          holdId: rental.depositHoldId,
          releasedAt: endTime,
        }).pipe(
          defectOn(WalletRepositoryError, WalletHoldRepositoryError),
        );

      if (!depositHandled) {
        return yield* Effect.die(new Error(
          `Expected rental ${rental.id} deposit hold ${rental.depositHoldId} to be handled during return finalization`,
        ));
      }
    }

    if (totalPriceMinor > 0n) {
      yield* debitWallet(makeWalletRepository(tx), {
        userId: rental.userId,
        amount: totalPriceMinor,
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
    );
    if (Option.isNone(updatedBike)) {
      return yield* Effect.fail(new BikeNotFound({ bikeId }));
    }

    const finalizedReturnSlot = yield* txReturnSlotRepo.finalizeActiveByRentalId(
      rental.id,
      "USED",
      endTime,
    ).pipe(
      defectOn(RentalRepositoryError),
    );
    if (Option.isNone(finalizedReturnSlot)) {
      return yield* Effect.fail(new ReturnSlotRequiredForReturn({
        rentalId: rental.id,
        endStationId,
      }));
    }

    const updatedRental = yield* txRentalRepo.updateRentalOnEnd({
      rentalId: rental.id,
      pricingPolicyId: pricingPolicy.id,
      endStationId,
      endTime,
      durationMinutes,
      totalPrice: Number(totalPriceMinor),
      newStatus: "COMPLETED",
    }).pipe(
      defectOn(RentalRepositoryError),
    );

    if (Option.isNone(updatedRental)) {
      return yield* Effect.die(new Error(
        `Expected rental ${rental.id} to remain completable during return finalization`,
      ));
    }

    yield* Effect.tryPromise({
      try: () =>
        tx.rentalBillingRecord.create({
          data: {
            rentalId: rental.id,
            pricingPolicyId: pricingPolicy.id,
            totalDurationMinutes: durationMinutes,
            estimatedDistanceKm: null,
            baseAmount: toPrismaDecimal(fullBaseAmountMinor.toString()),
            overtimeAmount: toPrismaDecimal("0"),
            couponDiscountAmount: toPrismaDecimal("0"),
            subscriptionDiscountAmount: toPrismaDecimal(subscriptionDiscountMinor.toString()),
            depositForfeited,
            totalAmount: toPrismaDecimal(totalPriceMinor.toString()),
          },
        }),
      catch: err => err,
    }).pipe(
      Effect.catchAll(err => Effect.die(err)),
    );

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
    defectOn(WalletRepositoryError),
  );
}
