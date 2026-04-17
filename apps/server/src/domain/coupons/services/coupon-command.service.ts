import { Effect, Option } from "effect";

import type { CouponCommandRepo } from "../repository/coupon.repository.types";
import type { CouponCommandService } from "./coupon.service.types";

import { CouponRuleNotFound } from "../domain-errors";

export function makeCouponCommandService(
  repo: CouponCommandRepo,
): CouponCommandService {
  return {
    createAdminCouponRule: input =>
      repo.createAdminCouponRule({
        name: input.name.trim(),
        triggerType: input.triggerType,
        minRidingMinutes: input.minRidingMinutes,
        minCompletedRentals: null,
        discountType: input.discountType,
        discountValue: input.discountValue,
        priority: input.priority ?? 100,
        status: input.status ?? "INACTIVE",
        activeFrom: input.activeFrom ?? null,
        activeTo: input.activeTo ?? null,
      }),
    activateAdminCouponRule: ruleId =>
      Effect.gen(function* () {
        const activatedOpt = yield* repo.activateAdminCouponRule(ruleId);

        if (Option.isNone(activatedOpt)) {
          return yield* Effect.fail(new CouponRuleNotFound({ ruleId }));
        }

        return activatedOpt.value;
      }),
    deactivateAdminCouponRule: ruleId =>
      Effect.gen(function* () {
        const deactivatedOpt = yield* repo.deactivateAdminCouponRule(ruleId);

        if (Option.isNone(deactivatedOpt)) {
          return yield* Effect.fail(new CouponRuleNotFound({ ruleId }));
        }

        return deactivatedOpt.value;
      }),
    updateAdminCouponRule: (ruleId, input) =>
      Effect.gen(function* () {
        const updatedOpt = yield* repo.updateAdminCouponRule(ruleId, {
          name: input.name.trim(),
          triggerType: input.triggerType,
          minRidingMinutes: input.minRidingMinutes,
          minCompletedRentals: null,
          discountType: input.discountType,
          discountValue: input.discountValue,
          priority: input.priority,
          status: input.status,
          activeFrom: input.activeFrom,
          activeTo: input.activeTo,
        });

        if (Option.isNone(updatedOpt)) {
          return yield* Effect.fail(new CouponRuleNotFound({ ruleId }));
        }

        return updatedOpt.value;
      }),
  };
}
