import type { SubscriptionError } from "@services/subscription.service";

import { subscriptionService } from "@services/subscription.service";
import { useQuery } from "@tanstack/react-query";

import type { Subscription } from "@/types/subscription-types";

export function useGetSubscriptionDetailQuery(
  id: string,
  enabled: boolean = false,
) {
  return useQuery<Subscription, SubscriptionError>({
    queryKey: ["subscriptions", "detail", id],
    enabled: enabled && Boolean(id),
    queryFn: async () => {
      const result = await subscriptionService.getDetail(id);
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
  });
}
