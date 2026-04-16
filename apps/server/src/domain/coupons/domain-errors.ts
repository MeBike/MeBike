import { Data } from "effect";

import type { WithGenericError } from "@/domain/shared/errors";

export class CouponRepositoryError extends Data.TaggedError("CouponRepositoryError")<
  WithGenericError
> {}
