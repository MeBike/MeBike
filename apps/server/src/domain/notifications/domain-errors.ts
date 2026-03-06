import { Data } from "effect";

import type { WithGenericError } from "@/domain/shared/errors";

export class PushTokenRepositoryError extends Data.TaggedError("PushTokenRepositoryError")<
  WithGenericError
> {}

export class InvalidPushToken extends Data.TaggedError("InvalidPushToken")<
  Record<string, never>
> {}

export class PushTokenNotFound extends Data.TaggedError("PushTokenNotFound")<{
  readonly userId: string;
  readonly token: string;
}> {}

export class PushProviderError extends Data.TaggedError("PushProviderError")<
  WithGenericError
> {}
