import { Data } from "effect";

import type { WithGenericError } from "@/domain/shared";

export class SubscriptionRepositoryError extends Data.TaggedError("SubscriptionRepositoryError")<
  WithGenericError
> {}

export class ActiveSubscriptionExists extends Data.TaggedError("ActiveSubscriptionExists")<{
  readonly subscriptionId: string;
}> {}

export class SubscriptionNotFound extends Data.TaggedError("SubscriptionNotFound")<{
  readonly subscriptionId: string;
}> {}

export class SubscriptionNotUsable extends Data.TaggedError("SubscriptionNotUsable")<{
  readonly subscriptionId: string;
  readonly status: string;
}> {}

export class SubscriptionExpired extends Data.TaggedError("SubscriptionExpired")<{
  readonly subscriptionId: string;
}> {}

export class SubscriptionUsageExceeded extends Data.TaggedError("SubscriptionUsageExceeded")<{
  readonly subscriptionId: string;
  readonly usageCount: number;
  readonly maxUsages: number;
}> {}

export class SubscriptionPendingOrActiveExists extends Data.TaggedError("SubscriptionPendingOrActiveExists")<{
  readonly userId: string;
}> {}

export class SubscriptionNotPending extends Data.TaggedError("SubscriptionNotPending")<{
  readonly subscriptionId: string;
}> {}
