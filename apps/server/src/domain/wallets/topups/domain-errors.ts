import { Data } from "effect";

import type { WithGenericError } from "@/domain/shared/errors";

export class PaymentAttemptRepositoryError extends Data.TaggedError("PaymentAttemptRepositoryError")<
  WithGenericError
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
