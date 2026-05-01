import { Data } from "effect";

type WithGenericError<T extends object = object> = T & {
  readonly operation?: string;
  readonly cause?: unknown;
};

export class PricingPolicyRepositoryError extends Data.TaggedError(
  "PricingPolicyRepositoryError",
)<WithGenericError> {}

export class PricingPolicyNotFound extends Data.TaggedError(
  "PricingPolicyNotFound",
)<{
    readonly pricingPolicyId: string;
  }> {}

export class ActivePricingPolicyNotFound extends Data.TaggedError(
  "ActivePricingPolicyNotFound",
)<{
    readonly reason: "MISSING_ACTIVE_POLICY";
  }> {}

export class ActivePricingPolicyAmbiguous extends Data.TaggedError(
  "ActivePricingPolicyAmbiguous",
)<{
    readonly pricingPolicyIds: ReadonlyArray<string>;
  }> {}

export class PricingPolicyAlreadyUsed extends Data.TaggedError(
  "PricingPolicyAlreadyUsed",
)<{
    readonly pricingPolicyId: string;
    readonly reservationCount: number;
    readonly rentalCount: number;
    readonly billingRecordCount: number;
  }> {}

export class PricingPolicyMutationWindowClosed extends Data.TaggedError(
  "PricingPolicyMutationWindowClosed",
)<{
    readonly currentTime: string;
    readonly timeZone: string;
    readonly windowStart: string;
    readonly windowEnd: string;
  }> {}

export class PricingPolicyInvalidInput extends Data.TaggedError(
  "PricingPolicyInvalidInput",
)<{
    readonly issues: ReadonlyArray<{
      readonly path: string;
      readonly message: string;
    }>;
  }> {}
