import { Data } from "effect";

import type { WithGenericError } from "@/domain/shared/errors";

export class AuthRepositoryError extends Data.TaggedError("AuthRepositoryError")<
  WithGenericError
> {}

export class AuthEventRepositoryError extends Data.TaggedError("AuthEventRepositoryError")<
  WithGenericError
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

export class InvalidRefreshToken extends Data.TaggedError("InvalidRefreshToken")<
  Record<string, never>
> {}

export class InvalidOtp extends Data.TaggedError("InvalidOtp")<{
  readonly retriable: boolean;
}> {}

export class InvalidResetToken extends Data.TaggedError("InvalidResetToken")<
  Record<string, never>
> {}

export type AuthFailure
  = | InvalidCredentials
    | InvalidRefreshToken
    | InvalidOtp
    | InvalidResetToken;
