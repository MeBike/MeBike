import { subscriptionService } from "@services/subscription.service";
import { useQuery } from "@tanstack/react-query";

import type { SubscriptionListParams } from "@/types/subscription-types";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

export function useGetSubscriptionsQuery(
  params: SubscriptionListParams = {},
  enabled: boolean = true,
) {
  const {
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
    status,
    user_id,
    package_name,
    start_date,
    end_date,
  } = params;

  return useQuery({
    queryKey: [
      "subscriptions",
      page,
      limit,
      status ?? null,
      user_id ?? null,
      package_name ?? null,
      start_date ?? null,
      end_date ?? null,
    ],
    enabled,
    queryFn: async () => {
      const response = await subscriptionService.getList({
        page,
        limit,
        status,
        user_id,
        package_name,
        start_date,
        end_date,
      });
      return response;
    },
  });
}
