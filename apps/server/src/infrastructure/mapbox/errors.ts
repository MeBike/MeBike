import { Data } from "effect";

export type MapboxRoutingOperation = "getRoute" | "getMatrix";

export class MapboxRoutingInitError extends Data.TaggedError("MapboxRoutingInitError")<{
  readonly message: string;
}> {}

export class MapboxRoutingRequestError extends Data.TaggedError("MapboxRoutingRequestError")<{
  readonly operation: MapboxRoutingOperation;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class MapboxRoutingResponseError extends Data.TaggedError("MapboxRoutingResponseError")<{
  readonly operation: MapboxRoutingOperation;
  readonly message: string;
  readonly body?: unknown;
}> {}

export class MapboxRoutingRateLimitError extends Data.TaggedError("MapboxRoutingRateLimitError")<{
  readonly operation: MapboxRoutingOperation;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export type MapboxRoutingError
  = | MapboxRoutingInitError
    | MapboxRoutingRateLimitError
    | MapboxRoutingRequestError
    | MapboxRoutingResponseError;
