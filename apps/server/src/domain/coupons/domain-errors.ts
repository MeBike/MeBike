import { Data } from "effect";

import type { WithGenericError } from "@/domain/shared/errors";

export class CouponRepositoryError extends Data.TaggedError("CouponRepositoryError")<
  WithGenericError
> {}

export class CouponRuleNotFound extends Data.TaggedError("CouponRuleNotFound")<{
  readonly ruleId: string;
}> {}

export class CouponRuleInvalidTier extends Data.TaggedError("CouponRuleInvalidTier")<{
  readonly minRidingMinutes: number;
  readonly discountValue: number;
}> {}

export class CouponRuleInvalidActiveWindow extends Data.TaggedError("CouponRuleInvalidActiveWindow")<{
  readonly activeFrom: Date;
  readonly activeTo: Date;
}> {}

export class CouponRuleActiveTierConflict extends Data.TaggedError("CouponRuleActiveTierConflict")<{
  readonly minRidingMinutes: number;
  readonly conflictingRuleId: string;
}> {}

export class CouponRuleAlreadyUsed extends Data.TaggedError("CouponRuleAlreadyUsed")<{
  readonly ruleId: string;
}> {}
