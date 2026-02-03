import type { SubscriptionError } from "@services/subscription.service";

import { subscriptionService } from "@services/subscription.service";
import { useMutation } from "@tanstack/react-query";

import type { CreateSubscriptionPayload, Subscription } from "@/types/subscription-types";

export function useSubscribeMutation() {
  return useMutation<Subscription, SubscriptionError, CreateSubscriptionPayload>({
    mutationFn: (payload: CreateSubscriptionPayload) =>
      subscriptionService.subscribe(payload).then((result) => {
        if (!result.ok) {
          throw result.error;
        }
        return result.value;
      }),
  });
}
