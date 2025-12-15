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
