import { Effect, Option } from "effect";

import type { WalletBalanceConstraint } from "@/domain/wallets/domain-errors";
import type { DecreaseBalanceInput } from "@/domain/wallets/models";
import type { Prisma as PrismaTypes } from "generated/prisma/client";

import { makeBikeRepository } from "@/domain/bikes";
import {
  makeCouponQueryRepository,
  selectBestGlobalAutoDiscountRule,
} from "@/domain/coupons";
import {
  calculateUsageChargeMinor,
  isAfterLateReturnCutoff,
  makePricingPolicyRepository,
} from "@/domain/pricing";
import { makeReservationQueryRepository } from "@/domain/reservations/repository/reservation-query.repository";
import { toPrismaDecimal } from "@/domain/shared/decimal";
import { toMinorUnit } from "@/domain/shared/money";
import { SubscriptionNotFound, SubscriptionUsageExceeded } from "@/domain/subscriptions/domain-errors";
import { makeSubscriptionCommandRepository } from "@/domain/subscriptions/repository/subscription-command.repository";
import { makeSubscriptionQueryRepository } from "@/domain/subscriptions/repository/subscription-query.repository";
import { makeWalletRepository } from "@/domain/wallets";

import type { RentalServiceFailure } from "../domain-errors";
import type { RentalRow } from "../models";

import {
  BikeNotFound,
  InsufficientBalanceToRent,
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
    const txCouponRepo = makeCouponQueryRepository(tx);
    const txRentalRepo = makeRentalRepository(tx);
    const txPricingPolicyRepo = makePricingPolicyRepository(tx);
    const txReturnSlotRepo = makeReturnSlotRepository(tx);

    const durationMinutes = Math.max(
      1,
      Math.floor((endTime.getTime() - new Date(rental.startTime).getTime()) / 60000),
    );

    const pricingPolicy = rental.pricingPolicyId
      ? (yield* txPricingPolicyRepo.getById(rental.pricingPolicyId).pipe(
          Effect.catchTag("PricingPolicyNotFound", err => Effect.die(err)),
        ))
      : (yield* txPricingPolicyRepo.getActive().pipe(
          Effect.catchTag("ActivePricingPolicyNotFound", err => Effect.die(err)),
          Effect.catchTag("ActivePricingPolicyAmbiguous", err => Effect.die(err)),
        ));

    const fullBaseAmountMinor = calculateUsageChargeMinor({
      durationMinutes,
      policy: pricingPolicy,
    });
    const billingUnitMinutes = Math.max(1, pricingPolicy.billingUnitMinutes);
    const billableBlocks = Math.max(1, Math.ceil(durationMinutes / billingUnitMinutes));
    const billableMinutes = billableBlocks * billingUnitMinutes;
    let basePriceMinor = fullBaseAmountMinor;
    let usageToAdd = 0;
    let prepaidMinor = 0n;
    let subscriptionDiscountMinor = 0n;

    const txReservationRepo = makeReservationQueryRepository(tx);
    const reservationOpt = rental.reservationId
      ? yield* txReservationRepo.findById(rental.reservationId)
      : Option.none();
    if (Option.isSome(reservationOpt)) {
      prepaidMinor = toMinorUnit(reservationOpt.value.prepaid);
    }

    if (rental.subscriptionId) {
      const txSubscriptionQueryRepo = makeSubscriptionQueryRepository(tx);
      const txSubscriptionCommandRepo = makeSubscriptionCommandRepository(tx);

      const subscriptionOpt = yield* txSubscriptionQueryRepo.findById(rental.subscriptionId);

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
        const incremented = yield* txSubscriptionCommandRepo.incrementUsage(
          subscription.id,
          subscription.usageCount,
          usageToAdd,
          ["ACTIVE", "PENDING"],
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

    const eligibleRentalAmountMinor = basePriceMinor > prepaidMinor
      ? basePriceMinor - prepaidMinor
      : 0n;
    let couponDiscountAmountMinor = 0n;

    if (!rental.subscriptionId && eligibleRentalAmountMinor > 0n) {
      const discountRules = yield* txCouponRepo.listGlobalBillingPreviewDiscountRules({
        previewedAt: endTime,
        billableMinutes,
      });
      couponDiscountAmountMinor = selectBestGlobalAutoDiscountRule(
        discountRules,
        eligibleRentalAmountMinor,
      ).discountAmountMinor;
    }

    const totalPriceMinor = eligibleRentalAmountMinor > couponDiscountAmountMinor
      ? eligibleRentalAmountMinor - couponDiscountAmountMinor
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
        )
        : yield* releaseRentalDepositHoldInTx({
          tx,
          holdId: rental.depositHoldId,
          releasedAt: endTime,
        });

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

    yield* txReturnSlotRepo.finalizeActiveByRentalId(
      rental.id,
      "USED",
      endTime,
    );

    const updatedRental = yield* txRentalRepo.updateRentalOnEnd({
      rentalId: rental.id,
      pricingPolicyId: pricingPolicy.id,
      endStationId,
      endTime,
      durationMinutes,
      totalPrice: Number(totalPriceMinor),
      newStatus: "COMPLETED",
    });

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
            couponDiscountAmount: toPrismaDecimal(couponDiscountAmountMinor.toString()),
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
  );
}
