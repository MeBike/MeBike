import type { Effect, Option } from "effect";

import type {
  EmailOtpKind,
  EmailOtpRecord,
  RefreshSession,
  ResetPasswordTokenRecord,
} from "../models";

export type AuthRepo = {
  readonly saveSession: (
    session: RefreshSession,
  ) => Effect.Effect<void>;
  readonly getSession: (
    sessionId: string,
  ) => Effect.Effect<Option.Option<RefreshSession>>;
  readonly deleteSession: (
    sessionId: string,
  ) => Effect.Effect<void>;
  readonly deleteAllSessionsForUser: (
    userId: string,
  ) => Effect.Effect<void>;
  readonly saveEmailOtp: (
    record: EmailOtpRecord,
  ) => Effect.Effect<void>;
  readonly getEmailOtp: (params: {
    userId: string;
    kind: EmailOtpKind;
  }) => Effect.Effect<Option.Option<EmailOtpRecord>>;
  readonly consumeEmailOtp: (params: {
    userId: string;
    kind: EmailOtpKind;
  }) => Effect.Effect<Option.Option<EmailOtpRecord>>;
  readonly verifyEmailOtpAttempt: (params: {
    userId: string;
    kind: EmailOtpKind;
    otp: string;
    email?: string;
  }) => Effect.Effect<"valid" | "invalidRetryable" | "invalidTerminal">;
  readonly saveResetPasswordToken: (
    record: ResetPasswordTokenRecord,
  ) => Effect.Effect<void>;
  readonly consumeResetPasswordToken: (
    token: string,
  ) => Effect.Effect<Option.Option<ResetPasswordTokenRecord>>;
};

export type AuthEventRepo = {
  readonly recordSessionIssued: (
    args: { userId: string; occurredAt: Date },
  ) => Effect.Effect<void>;
};
