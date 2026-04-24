import type { SubscriptionError } from "@services/subscription.service";

import { subscriptionService } from "@services/subscription.service";
import { useQuery } from "@tanstack/react-query";

import type { SubscriptionListParams, SubscriptionListResponse } from "@/types/subscription-types";

import { subscriptionQueryKeys } from "./subscription-query-keys";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

export function useGetSubscriptionsQuery(
  params: SubscriptionListParams = {},
  enabled: boolean = true,
  scope?: string | null,
) {
  const {
    page = DEFAULT_PAGE,
    pageSize = DEFAULT_PAGE_SIZE,
    status,
  } = params;

  return useQuery<SubscriptionListResponse, SubscriptionError>({
    queryKey: subscriptionQueryKeys.list(scope, { page, pageSize, status }),
    enabled,
    queryFn: async () => {
      const result = await subscriptionService.getList({
        page,
        pageSize,
        status,
      });
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
  });
}
