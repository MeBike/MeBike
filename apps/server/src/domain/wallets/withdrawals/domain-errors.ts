import { Data } from "effect";

import type { WithGenericError } from "@/domain/shared/errors";

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
