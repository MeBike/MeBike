import type { PrismaClient } from "../generated/prisma/client";

import {
  AccountStatus,
  CouponTriggerType,
  DiscountType,
} from "../generated/prisma/client";

const DEFAULT_GLOBAL_COUPON_RULES = [
  {
    id: "019b17bd-d130-7e7d-be69-91ceef7b7201",
    name: "Ride 1h discount",
    minRidingMinutes: 60,
    discountValue: "1000",
    priority: 100,
  },
  {
    id: "019b17bd-d130-7e7d-be69-91ceef7b7202",
    name: "Ride 2h discount",
    minRidingMinutes: 120,
    discountValue: "2000",
    priority: 100,
  },
  {
    id: "019b17bd-d130-7e7d-be69-91ceef7b7203",
    name: "Ride 4h discount",
    minRidingMinutes: 240,
    discountValue: "4000",
    priority: 100,
  },
  {
    id: "019b17bd-d130-7e7d-be69-91ceef7b7204",
    name: "Ride 6h discount",
    minRidingMinutes: 360,
    discountValue: "6000",
    priority: 100,
  },
] as const;

type SeedGlobalCouponRulesOptions = {
  readonly demoMode?: boolean;
};

export async function seedDefaultGlobalCouponRules(
  prisma: PrismaClient,
  options: SeedGlobalCouponRulesOptions = {},
) {
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    if (options.demoMode) {
      await tx.couponRule.updateMany({
        where: {
          status: AccountStatus.ACTIVE,
          triggerType: CouponTriggerType.RIDING_DURATION,
          discountType: DiscountType.FIXED_AMOUNT,
          id: {
            notIn: DEFAULT_GLOBAL_COUPON_RULES.map(rule => rule.id),
          },
        },
        data: {
          status: AccountStatus.INACTIVE,
          updatedAt: now,
        },
      });
    }

    for (const rule of DEFAULT_GLOBAL_COUPON_RULES) {
      await tx.couponRule.upsert({
        where: { id: rule.id },
        update: {
          name: rule.name,
          triggerType: CouponTriggerType.RIDING_DURATION,
          minRidingMinutes: rule.minRidingMinutes,
          minCompletedRentals: null,
          discountType: DiscountType.FIXED_AMOUNT,
          discountValue: rule.discountValue,
          status: AccountStatus.ACTIVE,
          priority: rule.priority,
          activeFrom: null,
          activeTo: null,
          updatedAt: now,
        },
        create: {
          id: rule.id,
          name: rule.name,
          triggerType: CouponTriggerType.RIDING_DURATION,
          minRidingMinutes: rule.minRidingMinutes,
          minCompletedRentals: null,
          discountType: DiscountType.FIXED_AMOUNT,
          discountValue: rule.discountValue,
          status: AccountStatus.ACTIVE,
          priority: rule.priority,
          activeFrom: null,
          activeTo: null,
          updatedAt: now,
        },
      });
    }
  });
}
