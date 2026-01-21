import { subscriptionService } from "@services/subscription.service";
import { useQuery } from "@tanstack/react-query";

export function useGetSubscriptionDetailQuery(
  id: string,
  enabled: boolean = false,
) {
  return useQuery({
    queryKey: ["subscriptions", "detail", id],
    enabled: enabled && Boolean(id),
    queryFn: async () => {
      const response = await subscriptionService.getDetail(id);
      return response;
    },
  });
}
