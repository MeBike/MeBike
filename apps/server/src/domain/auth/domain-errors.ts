import { Data } from "effect";

import type { WithGenericError } from "@/domain/shared/errors";

export class AuthRepositoryError extends Data.TaggedError("AuthRepositoryError")<
  WithGenericError<object>
> {}

export class SessionNotFound extends Data.TaggedError("SessionNotFound")<{
  readonly sessionId: string;
}> {}

export class OtpNotFound extends Data.TaggedError("OtpNotFound")<{
  readonly userId: string;
  readonly kind: "verify-email" | "reset-password";
}> {}
