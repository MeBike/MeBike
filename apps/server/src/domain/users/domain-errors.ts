import { Data } from "effect";

import type { WithGenericError } from "@/domain/shared";

export class UserRepositoryError extends Data.TaggedError("UserRepositoryError")<
  WithGenericError
> {}

export class DuplicateUserEmail extends Data.TaggedError("DuplicateUserEmail")<{
  readonly email: string;
}> {}

export class DuplicateUserPhoneNumber extends Data.TaggedError(
  "DuplicateUserPhoneNumber",
)<{
    readonly phoneNumber: string;
  }> {}

export class UserStatsServiceError extends Data.TaggedError("UserStatsServiceError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class InvalidStatsRange extends Data.TaggedError("InvalidStatsRange")<{
  readonly startDate: Date;
  readonly endDate: Date;
}> {}

export class InvalidStatsGroupBy extends Data.TaggedError("InvalidStatsGroupBy")<{
  readonly groupBy: string;
}> {}
