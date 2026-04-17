import { Effect, Option } from "effect";

import {
  isAllowedGlobalAutoDiscountTier,
} from "../global-auto-discount.policy";
import type { CouponCommandRepo } from "../repository/coupon.repository.types";
import type { CouponCommandService } from "./coupon.service.types";

import {
  CouponRuleActiveTierConflict,
  CouponRuleAlreadyUsed,
  CouponRuleInvalidActiveWindow,
  CouponRuleInvalidTier,
  CouponRuleNotFound,
} from "../domain-errors";

export function makeCouponCommandService(
  repo: CouponCommandRepo,
): CouponCommandService {
  const validateCouponRuleInput = (input: {
    readonly minRidingMinutes: number;
    readonly discountValue: number;
    readonly activeFrom?: Date | null;
    readonly activeTo?: Date | null;
  }) =>
    Effect.gen(function* () {
      if (!isAllowedGlobalAutoDiscountTier(input)) {
        return yield* Effect.fail(new CouponRuleInvalidTier({
          minRidingMinutes: input.minRidingMinutes,
          discountValue: input.discountValue,
        }));
      }

      if (
        input.activeFrom
        && input.activeTo
        && input.activeFrom.getTime() > input.activeTo.getTime()
      ) {
        return yield* Effect.fail(new CouponRuleInvalidActiveWindow({
          activeFrom: input.activeFrom,
          activeTo: input.activeTo,
        }));
      }
    });

  const ensureNoActiveTierConflict = (
    minRidingMinutes: number,
    excludeRuleId?: string,
  ) =>
    Effect.gen(function* () {
      const conflicting = yield* repo.findActiveRuleWithMinRidingMinutes(
        minRidingMinutes,
        excludeRuleId,
      );

      if (Option.isSome(conflicting)) {
        return yield* Effect.fail(new CouponRuleActiveTierConflict({
          minRidingMinutes,
          conflictingRuleId: conflicting.value.id,
        }));
      }
    });

  return {
    createAdminCouponRule: input =>
      Effect.gen(function* () {
        const status = input.status ?? "INACTIVE";
        yield* validateCouponRuleInput(input);
        if (status === "ACTIVE") {
          yield* ensureNoActiveTierConflict(input.minRidingMinutes);
        }

        return yield* repo.createAdminCouponRule({
          name: input.name.trim(),
          triggerType: input.triggerType,
          minRidingMinutes: input.minRidingMinutes,
          minCompletedRentals: null,
          discountType: input.discountType,
          discountValue: input.discountValue,
          priority: input.priority ?? 100,
          status,
          activeFrom: input.activeFrom ?? null,
          activeTo: input.activeTo ?? null,
        });
      }),
    activateAdminCouponRule: ruleId =>
      Effect.gen(function* () {
        const existingOpt = yield* repo.findAdminCouponRule(ruleId);

        if (Option.isNone(existingOpt)) {
          return yield* Effect.fail(new CouponRuleNotFound({ ruleId }));
        }

        const existing = existingOpt.value;
        if (existing.minRidingMinutes === null) {
          return yield* Effect.fail(new CouponRuleInvalidTier({
            minRidingMinutes: 0,
            discountValue: Number(existing.discountValue),
          }));
        }

        yield* validateCouponRuleInput({
          minRidingMinutes: existing.minRidingMinutes,
          discountValue: Number(existing.discountValue),
          activeFrom: existing.activeFrom,
          activeTo: existing.activeTo,
        });
        yield* ensureNoActiveTierConflict(existing.minRidingMinutes, ruleId);

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
        yield* validateCouponRuleInput(input);

        const existingOpt = yield* repo.findAdminCouponRule(ruleId);
        if (Option.isNone(existingOpt)) {
          return yield* Effect.fail(new CouponRuleNotFound({ ruleId }));
        }

        const used = yield* repo.hasRentalBillingRecordForRule(ruleId);
        if (used) {
          return yield* Effect.fail(new CouponRuleAlreadyUsed({ ruleId }));
        }

        if (input.status === "ACTIVE") {
          yield* ensureNoActiveTierConflict(input.minRidingMinutes, ruleId);
        }

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
