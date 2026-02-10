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
