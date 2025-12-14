import { Data } from "effect";

import type { WithGenericError } from "@/domain/shared";

export class RentalRepositoryError extends Data.TaggedError("RentalRepositoryError")<
  WithGenericError
> {}
