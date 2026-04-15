import { Data } from "effect";

export class ActiveEnvironmentPolicyNotFound extends Data.TaggedError(
  "ActiveEnvironmentPolicyNotFound",
)<{
  readonly reason: "MISSING_ACTIVE_POLICY";
}> {}

export class EnvironmentPolicyNotFound extends Data.TaggedError(
  "EnvironmentPolicyNotFound",
)<{
  readonly policyId: string;
}> {}

export class EnvironmentPolicyActivationBlocked extends Data.TaggedError(
  "EnvironmentPolicyActivationBlocked",
)<{
  readonly policyId: string;
  readonly status: "SUSPENDED" | "BANNED";
}> {}

export class EnvironmentImpactRentalNotFound extends Data.TaggedError(
  "EnvironmentImpactRentalNotFound",
)<{
  readonly rentalId: string;
}> {}

export class EnvironmentImpactNotFound extends Data.TaggedError(
  "EnvironmentImpactNotFound",
)<{
  readonly rentalId: string;
  readonly userId: string;
}> {}

export class EnvironmentImpactRentalNotCompleted extends Data.TaggedError(
  "EnvironmentImpactRentalNotCompleted",
)<{
  readonly rentalId: string;
  readonly status: string;
}> {}

export class EnvironmentImpactAlreadyExists extends Data.TaggedError(
  "EnvironmentImpactAlreadyExists",
)<{
  readonly rentalId: string;
}> {}
