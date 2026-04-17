import { Effect, Layer, Option } from "effect";

import type { GlobalAutoDiscountSelection } from "@/domain/coupons";
import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import {
  CouponQueryServiceTag,
  selectBestGlobalAutoDiscountRule,
} from "@/domain/coupons";
import {
  calculateUsageChargeMinor,
  isAfterLateReturnCutoff,
  makePricingPolicyRepository,
} from "@/domain/pricing";
import { makeReservationQueryRepository } from "@/domain/reservations/repository/reservation-query.repository";
import { toMinorUnit } from "@/domain/shared/money";
import {
  SubscriptionNotFound,
  SubscriptionNotUsable,
} from "@/domain/subscriptions/domain-errors";
import { makeSubscriptionQueryRepository } from "@/domain/subscriptions/repository/subscription-query.repository";
import { Prisma } from "@/infrastructure/prisma";

import type { RentalBillingPreviewRow, RentalRow } from "../models";

import {
  BillingPreviewRequiresActiveRental,
  RentalNotFound,
} from "../domain-errors";
import { computeSubscriptionCoverage } from "../pricing";
import { makeRentalRepository } from "../repository/rental.repository";

type RentalBillingPreviewInput = {
  readonly rentalId: string;
  readonly userId: string;
  readonly previewedAt: Date;
};

export type RentalBillingPreviewService = {
  previewForUser: (
    input: RentalBillingPreviewInput,
  ) => Effect.Effect<
    RentalBillingPreviewRow,
    RentalNotFound
      | BillingPreviewRequiresActiveRental
      | SubscriptionNotFound
      | SubscriptionNotUsable
  >;
};

const makeRentalBillingPreviewServiceEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  const couponService = yield* CouponQueryServiceTag;

  const rentalRepo = makeRentalRepository(client);
  const pricingPolicyRepo = makePricingPolicyRepository(client);
  const reservationRepo = makeReservationQueryRepository(client);
  const subscriptionRepo = makeSubscriptionQueryRepository(client);

  const service: RentalBillingPreviewService = {
    previewForUser: input =>
      Effect.gen(function* () {
        const rentalOpt = yield* rentalRepo.getMyRentalById(input.userId, input.rentalId);

        if (Option.isNone(rentalOpt)) {
          return yield* Effect.fail(new RentalNotFound({
            rentalId: input.rentalId,
            userId: input.userId,
          }));
        }

        const rental = rentalOpt.value;
        if (rental.status !== "RENTED") {
          return yield* Effect.fail(new BillingPreviewRequiresActiveRental({
            rentalId: rental.id,
            status: rental.status,
          }));
        }

        const pricingPolicy = rental.pricingPolicyId
          ? yield* pricingPolicyRepo.getById(rental.pricingPolicyId).pipe(
              Effect.catchTag("PricingPolicyNotFound", err => Effect.die(err)),
            )
          : yield* pricingPolicyRepo.getActive().pipe(
              Effect.catchTag("ActivePricingPolicyNotFound", err => Effect.die(err)),
              Effect.catchTag("ActivePricingPolicyAmbiguous", err => Effect.die(err)),
            );

        const rentalMinutes = calculatePreviewRentalMinutes(rental, input.previewedAt);
        const billingUnitMinutes = Math.max(1, pricingPolicy.billingUnitMinutes);
        const billableBlocks = Math.max(1, Math.ceil(rentalMinutes / billingUnitMinutes));
        const billableMinutes = billableBlocks * billingUnitMinutes;
        const billableHours = billableMinutes / 60;
        const baseRentalAmountMinor = calculateUsageChargeMinor({
          durationMinutes: rentalMinutes,
          policy: pricingPolicy,
        });

        let prepaidAmountMinor = 0n;
        if (rental.reservationId) {
          const reservationOpt = yield* reservationRepo.findById(rental.reservationId);
          if (Option.isSome(reservationOpt)) {
            prepaidAmountMinor = toMinorUnit(reservationOpt.value.prepaid);
          }
        }

        const subscriptionApplied = Boolean(rental.subscriptionId);
        let subscriptionDiscountAmountMinor = 0n;
        let remainingRentalAmountMinor = baseRentalAmountMinor;

        if (rental.subscriptionId) {
          const subscriptionOpt = yield* subscriptionRepo.findById(rental.subscriptionId);

          if (Option.isNone(subscriptionOpt)) {
            return yield* Effect.fail(new SubscriptionNotFound({
              subscriptionId: rental.subscriptionId,
            }));
          }

          const coverage = yield* computeSubscriptionCoverage({
            durationMinutes: rentalMinutes,
            pricingPolicy,
            subscription: subscriptionOpt.value,
            userId: rental.userId,
          });

          remainingRentalAmountMinor = coverage.basePriceMinor;
          subscriptionDiscountAmountMinor = coverage.subscriptionDiscountMinor;
        }

        const eligibleRentalAmountMinor = remainingRentalAmountMinor > prepaidAmountMinor
          ? remainingRentalAmountMinor - prepaidAmountMinor
          : 0n;

        let discountSelection: GlobalAutoDiscountSelection = {
          rule: null,
          discountAmountMinor: 0n,
        };
        if (!subscriptionApplied && eligibleRentalAmountMinor > 0n) {
          const discountRules = yield* couponService.listGlobalBillingPreviewDiscountRules({
            previewedAt: input.previewedAt,
            ridingDurationMinutes: rentalMinutes,
          });
          discountSelection = selectBestGlobalAutoDiscountRule(
            discountRules,
            eligibleRentalAmountMinor,
          );
        }
        const bestDiscountRule = discountSelection.rule;
        const couponDiscountAmountMinor = discountSelection.discountAmountMinor;

        const penaltyAmountMinor = yield* loadPenaltyAmountMinor(client, rental.id);
        const depositForfeited = Boolean(rental.depositHoldId)
          && isAfterLateReturnCutoff(input.previewedAt, pricingPolicy.lateReturnCutoff);
        const payableRentalAmountMinor = eligibleRentalAmountMinor > couponDiscountAmountMinor
          ? eligibleRentalAmountMinor - couponDiscountAmountMinor
          : 0n;
        const totalPayableAmountMinor = payableRentalAmountMinor + penaltyAmountMinor;

        return {
          rentalId: rental.id,
          previewedAt: input.previewedAt,
          pricingPolicyId: pricingPolicy.id,
          rentalMinutes,
          billableBlocks,
          billableHours,
          baseRentalAmount: Number(baseRentalAmountMinor),
          prepaidAmount: Number(prepaidAmountMinor),
          eligibleRentalAmount: Number(eligibleRentalAmountMinor),
          subscriptionApplied,
          subscriptionDiscountAmount: Number(subscriptionDiscountAmountMinor),
          bestDiscountRule: bestDiscountRule
            ? {
                ruleId: bestDiscountRule.ruleId,
                name: bestDiscountRule.name,
                triggerType: bestDiscountRule.triggerType,
                minRidingMinutes: bestDiscountRule.minRidingMinutes ?? 0,
                discountType: bestDiscountRule.discountType,
                discountValue: Number(toMinorUnit(bestDiscountRule.discountValue)),
              }
            : null,
          couponDiscountAmount: Number(couponDiscountAmountMinor),
          penaltyAmount: Number(penaltyAmountMinor),
          depositForfeited,
          payableRentalAmount: Number(payableRentalAmountMinor),
          totalPayableAmount: Number(totalPayableAmountMinor),
        };
      }),
  };

  return service;
});

function calculatePreviewRentalMinutes(rental: RentalRow, previewedAt: Date) {
  return Math.max(
    1,
    Math.ceil((previewedAt.getTime() - new Date(rental.startTime).getTime()) / 60000),
  );
}

function loadPenaltyAmountMinor(
  client: PrismaClient | PrismaTypes.TransactionClient,
  rentalId: string,
) {
  return Effect.tryPromise({
    try: async () => {
      const result = await client.rentalPenalty.aggregate({
        where: { rentalId },
        _sum: { amount: true },
      });

      return result._sum.amount ? toMinorUnit(result._sum.amount) : 0n;
    },
    catch: err => err,
  }).pipe(
    Effect.catchAll(err => Effect.die(err)),
  );
}

export class RentalBillingPreviewServiceTag extends Effect.Service<RentalBillingPreviewServiceTag>()(
  "RentalBillingPreviewService",
  {
    effect: makeRentalBillingPreviewServiceEffect,
  },
) {}

export const RentalBillingPreviewServiceLive = Layer.effect(
  RentalBillingPreviewServiceTag,
  makeRentalBillingPreviewServiceEffect.pipe(
    Effect.map(RentalBillingPreviewServiceTag.make),
  ),
);
