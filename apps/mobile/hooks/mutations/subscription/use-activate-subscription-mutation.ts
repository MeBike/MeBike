import type { SubscriptionError } from "@services/subscription.service";

import { subscriptionService } from "@services/subscription.service";
import { useMutation } from "@tanstack/react-query";

import type { Subscription } from "@/types/subscription-types";

export function useActivateSubscriptionMutation() {
  return useMutation<Subscription, SubscriptionError, string>({
    mutationFn: (subscriptionId: string) =>
      subscriptionService.activate(subscriptionId).then((result) => {
        if (!result.ok) {
          throw result.error;
        }
        return result.value;
      }),
  });
}
