import { Effect, Option } from "effect";

import type { makePricingPolicyRepository } from "@/domain/pricing";
import type { makeSubscriptionCommandRepository, makeSubscriptionQueryRepository } from "@/domain/subscriptions";
import type { makeWalletRepository } from "@/domain/wallets/repository/wallet.repository";

import { getReservationFeeMinor } from "@/domain/pricing";
import { toPrismaDecimal } from "@/domain/shared/decimal";
import { InsufficientWalletBalance, WalletNotFound } from "@/domain/wallets/domain-errors";

import type { FixedSlotBillingResult } from "./fixed-slot-template.types";

import { FixedSlotTemplateBillingConflict } from "../../domain-errors";

/**
 * Tinh billing cho mot lo ngay fixed-slot se duoc materialize.
 * Uu tien subscription neu du luot, khong thi tru wallet.
 *
 * @param args Dau vao billing.
 * @param args.userId ID user bi charge.
 * @param args.totalSlots So ngay can charge trong lan nay.
 * @param args.description Mo ta transaction wallet neu phai debit.
 * @param args.txPricingPolicyRepo Repo pricing trong transaction hien tai.
 * @param args.txSubscriptionQueryRepo Repo query subscription trong transaction hien tai.
 * @param args.txSubscriptionCommandRepo Repo command subscription trong transaction hien tai.
 * @param args.txWalletRepo Repo wallet trong transaction hien tai.
 * @returns Effect tra ve billing snapshot de gan vao reservation duoc tao tu fixed-slot.
 */
export function billFixedSlotDates(args: {
  userId: string;
  totalSlots: number;
  description?: string;
  txPricingPolicyRepo: ReturnType<typeof makePricingPolicyRepository>;
  txSubscriptionQueryRepo: ReturnType<typeof makeSubscriptionQueryRepository>;
  txSubscriptionCommandRepo: ReturnType<typeof makeSubscriptionCommandRepository>;
  txWalletRepo: ReturnType<typeof makeWalletRepository>;
}): Effect.Effect<
  FixedSlotBillingResult,
  FixedSlotTemplateBillingConflict | WalletNotFound | InsufficientWalletBalance
> {
  return Effect.gen(function* () {
    const pricingPolicy = yield* args.txPricingPolicyRepo.getActive().pipe(
      Effect.catchTag("ActivePricingPolicyNotFound", err => Effect.die(err)),
      Effect.catchTag("ActivePricingPolicyAmbiguous", err => Effect.die(err)),
    );
    const prepaidMinor = getReservationFeeMinor(pricingPolicy);

    let subscriptionId: string | null = null;
    let prepaid = toPrismaDecimal(prepaidMinor.toString());

    const currentSubscriptionOpt = yield* args.txSubscriptionQueryRepo.findCurrentForUser(
      args.userId,
      ["ACTIVE", "PENDING"],
    );

    if (Option.isSome(currentSubscriptionOpt)) {
      const subscription = currentSubscriptionOpt.value;
      const remainingUsages = subscription.maxUsages === null
        ? null
        : subscription.maxUsages - subscription.usageCount;

      if (remainingUsages === null || remainingUsages >= args.totalSlots) {
        const incremented = yield* args.txSubscriptionCommandRepo.incrementUsage(
          subscription.id,
          subscription.usageCount,
          args.totalSlots,
          ["ACTIVE", "PENDING"],
        );

        if (Option.isNone(incremented)) {
          return yield* Effect.fail(new FixedSlotTemplateBillingConflict({ userId: args.userId }));
        }

        subscriptionId = subscription.id;
        prepaid = toPrismaDecimal("0");
      }
    }

    if (subscriptionId === null) {
      const totalPrepaidMinor = prepaidMinor * BigInt(args.totalSlots);

      yield* args.txWalletRepo.decreaseBalance({
        userId: args.userId,
        amount: totalPrepaidMinor,
        description: args.description ?? "Fixed-slot reservation prepaid",
      }).pipe(
        Effect.catchTag("WalletRecordNotFound", () =>
          Effect.fail(new WalletNotFound({ userId: args.userId }))),
        Effect.catchTag("WalletBalanceConstraint", ({ walletId, userId, balance, attemptedDebit }) =>
          Effect.fail(new InsufficientWalletBalance({
            walletId,
            userId,
            balance,
            attemptedDebit,
          }))),
      );
    }

    return {
      pricingPolicyId: pricingPolicy.id,
      subscriptionId,
      prepaid,
    };
  });
}
