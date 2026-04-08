import { Data } from "effect";

export class AgencyRepositoryError extends Data.TaggedError("AgencyRepositoryError")<{
  readonly operation: string;
  readonly cause: unknown;
}> {}

export class AgencyNotFound extends Data.TaggedError("AgencyNotFound")<{
  readonly id: string;
}> {}
