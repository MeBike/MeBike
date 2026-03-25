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
