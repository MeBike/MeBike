import { Data } from "effect";

import type { WithGenericError } from "@/domain/shared";

export class WalletRepositoryError extends Data.TaggedError("WalletRepositoryError")<
  WithGenericError
> {}

export class WalletHoldRepositoryError extends Data.TaggedError("WalletHoldRepositoryError")<
  WithGenericError
> {}

export class WalletUniqueViolation extends Data.TaggedError("WalletUniqueViolation")<
  WithGenericError & {
    readonly constraint: string;
    readonly userId?: string;
  }
> {}

export class WalletRecordNotFound extends Data.TaggedError("WalletRecordNotFound")<
  WithGenericError & {
    readonly userId?: string;
    readonly walletId?: string;
  }
> {}

export class WalletBalanceConstraint extends Data.TaggedError("WalletBalanceConstraint")<
  WithGenericError & {
    readonly walletId: string;
    readonly userId: string;
    readonly balance: bigint;
    readonly attemptedDebit: bigint;
  }
> {}

export class WalletAlreadyExists extends Data.TaggedError("WalletAlreadyExists")<{
  readonly userId: string;
}> {}

export class WalletNotFound extends Data.TaggedError("WalletNotFound")<{
  readonly userId?: string;
  readonly walletId?: string;
}> {}

export class InsufficientWalletBalance extends Data.TaggedError("InsufficientWalletBalance")<{
  readonly walletId: string;
  readonly userId: string;
  readonly balance: bigint;
  readonly attemptedDebit: bigint;
}> {}

export class PaymentAttemptRepositoryError extends Data.TaggedError("PaymentAttemptRepositoryError")<
  WithGenericError
> {}

export class PaymentAttemptUniqueViolation extends Data.TaggedError("PaymentAttemptUniqueViolation")<
  WithGenericError<{ readonly constraint?: string | string[] }>
> {}

export class PaymentAttemptNotFound extends Data.TaggedError("PaymentAttemptNotFound")<{
  readonly paymentAttemptId: string;
}> {}

export class PaymentAttemptAlreadyProcessed extends Data.TaggedError("PaymentAttemptAlreadyProcessed")<{
  readonly paymentAttemptId: string;
  readonly status: string;
}> {}

export class PaymentAttemptMismatch extends Data.TaggedError("PaymentAttemptMismatch")<{
  readonly paymentAttemptId: string;
  readonly expectedAmountMinor: bigint;
  readonly receivedAmountMinor: bigint;
  readonly expectedCurrency: string;
  readonly receivedCurrency: string;
}> {}

export class TopupProviderError extends Data.TaggedError("TopupProviderError")<
  WithGenericError<{ readonly provider: string }>
> {}

export class InvalidTopupRequest extends Data.TaggedError("InvalidTopupRequest")<{
  readonly message: string;
}> {}

export class WithdrawalRepositoryError extends Data.TaggedError("WithdrawalRepositoryError")<
  WithGenericError
> {}

export class WithdrawalUniqueViolation extends Data.TaggedError("WithdrawalUniqueViolation")<
  WithGenericError<{ readonly constraint?: string | string[] }>
> {}

export class WithdrawalNotFound extends Data.TaggedError("WithdrawalNotFound")<{
  readonly withdrawalId: string;
}> {}

export class DuplicateWithdrawalRequest extends Data.TaggedError("DuplicateWithdrawalRequest")<{
  readonly idempotencyKey: string;
  readonly existing: import("./models").WalletWithdrawalRow;
}> {}

export class WithdrawalProviderError extends Data.TaggedError("WithdrawalProviderError")<
  WithGenericError<{ readonly provider: string; readonly operation: string }>
> {}

export class StripeConnectNotEnabled extends Data.TaggedError("StripeConnectNotEnabled")<
  WithGenericError<{ readonly provider: string; readonly operation: string }>
> {}

export class InvalidWithdrawalRequest extends Data.TaggedError("InvalidWithdrawalRequest")<{
  readonly message: string;
}> {}

export class WithdrawalUserNotFound extends Data.TaggedError("WithdrawalUserNotFound")<{
  readonly userId: string;
}> {}

export class StripeConnectNotLinked extends Data.TaggedError("StripeConnectNotLinked")<{
  readonly userId: string;
}> {}

export class StripePayoutsNotEnabled extends Data.TaggedError("StripePayoutsNotEnabled")<{
  readonly userId: string;
  readonly accountId: string;
}> {}
