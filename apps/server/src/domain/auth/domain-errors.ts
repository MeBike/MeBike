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

export class InvalidCredentials extends Data.TaggedError("InvalidCredentials")<
  Record<string, never>
> {}

export class UserNotVerified extends Data.TaggedError("UserNotVerified")<{
  readonly userId: string;
}> {}

export class InvalidRefreshToken extends Data.TaggedError("InvalidRefreshToken")<
  Record<string, never>
> {}

export class InvalidOtp extends Data.TaggedError("InvalidOtp")<Record<string, never>> {}

export type AuthFailure
  = | InvalidCredentials
    | UserNotVerified
    | InvalidRefreshToken
    | InvalidOtp;
