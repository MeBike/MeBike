import { Data } from "effect";

export class AiConfigurationError extends Data.TaggedError("AiConfigurationError")<{
  readonly message: string;
}> {}

export class AiInvalidRequestError extends Data.TaggedError("AiInvalidRequestError")<{
  readonly message: string;
}> {}

export class AiUnavailableError extends Data.TaggedError("AiUnavailableError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}
