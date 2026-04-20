import { Effect, Option } from "effect";

import type {
  BillingPreviewDiscountRuleRow,
  CouponRuleSnapshot,
  GlobalAutoDiscountSelection,
} from "@/domain/coupons";
import type { RentalServiceFailure } from "@/domain/rentals/domain-errors";
import type { RentalRow } from "@/domain/rentals/models";
import type { Prisma as PrismaTypes } from "generated/prisma/client";

import { makeCouponQueryRepository, selectBestGlobalAutoDiscountRule } from "@/domain/coupons";
import {
  calculateUsageChargeMinor,
  isAfterLateReturnCutoff,
  isPastRentalReturnDeadline,
  makePricingPolicyRepository,
} from "@/domain/pricing";
import { makeReservationQueryRepository } from "@/domain/reservations/repository/reservation-query.repository";
import { toMinorUnit } from "@/domain/shared/money";
import { SubscriptionNotFound, SubscriptionUsageExceeded } from "@/domain/subscriptions/domain-errors";
import { makeSubscriptionCommandRepository } from "@/domain/subscriptions/repository/subscription-command.repository";
import { makeSubscriptionQueryRepository } from "@/domain/subscriptions/repository/subscription-query.repository";

import type { FinalizeRentalReturnPricing } from "./finalize-rental-return.types";

import { InvalidRentalState } from "../../domain-errors";
import { computeSubscriptionCoverage } from "../../pricing";

/**
 * Tính toàn bộ phần pricing/billing cho bước hoàn tất trả xe.
 *
 * Hàm này chỉ lo phần quyết định nghiệp vụ về giá:
 * kiểm tra hạn trả, prepaid, subscription, coupon và cờ mất cọc.
 */
export function resolveFinalizeRentalReturnPricingInTx(args: {
  readonly tx: PrismaTypes.TransactionClient;
  readonly rental: RentalRow;
  readonly endTime: Date;
}): Effect.Effect<FinalizeRentalReturnPricing, RentalServiceFailure> {
  return Effect.gen(function* () {
    const { tx, rental, endTime } = args;
    const txCouponRepo = makeCouponQueryRepository(tx);
    const txPricingPolicyRepo = makePricingPolicyRepository(tx);

    const durationMinutes = Math.max(
      1,
      Math.ceil((endTime.getTime() - new Date(rental.startTime).getTime()) / 60000),
    );

    const pricingPolicy = rental.pricingPolicyId
      ? (yield* txPricingPolicyRepo.getById(rental.pricingPolicyId).pipe(
          Effect.catchTag("PricingPolicyNotFound", err => Effect.die(err)),
        ))
      : (yield* txPricingPolicyRepo.getActive().pipe(
          Effect.catchTag("ActivePricingPolicyNotFound", err => Effect.die(err)),
          Effect.catchTag("ActivePricingPolicyAmbiguous", err => Effect.die(err)),
        ));

    if (isPastRentalReturnDeadline(rental.startTime, endTime, pricingPolicy.lateReturnCutoff)) {
      return yield* Effect.fail(new InvalidRentalState({
        rentalId: rental.id,
        from: rental.status,
        to: "OVERDUE_UNRETURNED",
      }));
    }

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
    let discountSelection: GlobalAutoDiscountSelection = {
      rule: null,
      discountAmountMinor: 0n,
    };

    if (!rental.subscriptionId && eligibleRentalAmountMinor > 0n) {
      const discountRules = yield* txCouponRepo.listGlobalBillingPreviewDiscountRules({
        previewedAt: endTime,
        billableMinutes,
      });
      discountSelection = selectBestGlobalAutoDiscountRule(
        discountRules,
        eligibleRentalAmountMinor,
      );
    }

    const selectedCouponRule = discountSelection.rule;
    const couponDiscountAmountMinor = discountSelection.discountAmountMinor;
    const couponRuleSnapshot = selectedCouponRule
      ? buildCouponRuleSnapshot({
          rule: selectedCouponRule,
          billableMinutes,
          billableHours: billableMinutes / 60,
          appliedAt: endTime,
        })
      : null;
    const totalPriceMinor = eligibleRentalAmountMinor > couponDiscountAmountMinor
      ? eligibleRentalAmountMinor - couponDiscountAmountMinor
      : 0n;
    const depositForfeited = Boolean(rental.depositHoldId)
      && isAfterLateReturnCutoff(endTime, pricingPolicy.lateReturnCutoff);

    return {
      pricingPolicy,
      durationMinutes,
      fullBaseAmountMinor,
      subscriptionDiscountMinor,
      couponDiscountAmountMinor,
      selectedCouponRule,
      couponRuleSnapshot,
      totalPriceMinor,
      depositForfeited,
    };
  });
}

/**
 * Chụp lại coupon đã áp dụng để lưu vào billing record.
 */
function buildCouponRuleSnapshot(input: {
  readonly rule: BillingPreviewDiscountRuleRow;
  readonly billableMinutes: number;
  readonly billableHours: number;
  readonly appliedAt: Date;
}): CouponRuleSnapshot {
  return {
    ruleId: input.rule.ruleId,
    name: input.rule.name,
    triggerType: "RIDING_DURATION",
    minRidingMinutes: input.rule.minRidingMinutes ?? 0,
    discountType: "FIXED_AMOUNT",
    discountValue: Number(toMinorUnit(input.rule.discountValue)),
    priority: input.rule.priority,
    billableMinutes: input.billableMinutes,
    billableHours: input.billableHours,
    appliedAt: input.appliedAt.toISOString(),
  };
}
