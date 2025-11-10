import { useMutation } from "@tanstack/react-query";

import { subscriptionService } from "@services/subscription.service";

export function useActivateSubscriptionMutation() {
  return useMutation({
    mutationFn: (subscriptionId: string) =>
      subscriptionService.activate(subscriptionId),
  });
}
