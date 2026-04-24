import type { SubscriptionListParams } from "@/types/subscription-types";

export const subscriptionQueryKeys = {
  all: () => ["subscriptions"] as const,
  list: (scope: string | null | undefined, params: SubscriptionListParams = {}) => [
    "subscriptions",
    scope ?? "guest",
    params.page ?? 1,
    params.pageSize ?? 10,
    params.status ?? null,
  ] as const,
};
