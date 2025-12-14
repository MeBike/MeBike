import { Data } from "effect";

import type { WithGenericError } from "@/domain/shared";

export class StationRepositoryError extends Data.TaggedError("StationRepositoryError")<
  WithGenericError
> {}

export class StationNotFound extends Data.TaggedError("StationNotFound")<{
  readonly id: string;
}> {}
