import { Data } from "effect";

export class ActiveEnvironmentPolicyNotFound extends Data.TaggedError(
  "ActiveEnvironmentPolicyNotFound",
)<{
  readonly reason: "MISSING_ACTIVE_POLICY";
}> {}
