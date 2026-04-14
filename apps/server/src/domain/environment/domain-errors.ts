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
