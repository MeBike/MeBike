import { useMutation } from "@tanstack/react-query";

import type { CreateSubscriptionPayload } from "@/types/subscription-types";

import { subscriptionService } from "@services/subscription.service";

export function useSubscribeMutation() {
  return useMutation({
    mutationFn: (payload: CreateSubscriptionPayload) =>
      subscriptionService.subscribe(payload),
  });
}
