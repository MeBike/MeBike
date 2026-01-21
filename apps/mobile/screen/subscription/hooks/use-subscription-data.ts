import { useActivateSubscriptionMutation } from "@hooks/mutations/Subscription/useActivateSubscriptionMutation";
import { useSubscribeMutation } from "@hooks/mutations/Subscription/useSubscribeMutation";
import { useGetSubscriptionsQuery } from "@hooks/query/Subscription/useGetSubscriptionsQuery";
import { useAuth } from "@providers/auth-providers";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import type {
  CreateSubscriptionPayload,
  SubscriptionListItem,
} from "@/types/subscription-types";

const PAGE_SIZE = 20;

type ActivatePayload = {
  id: string;
};

export function useSubscriptionData() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const subscriptionsQuery = useGetSubscriptionsQuery(
    { page: 1, limit: PAGE_SIZE },
    isAuthenticated,
  );

  const { data, isLoading, isFetching, refetch } = subscriptionsQuery;

  const subscribeMutation = useSubscribeMutation();
  const activateMutation = useActivateSubscriptionMutation();

  const subscriptions: SubscriptionListItem[] = useMemo(
    () => data?.data ?? [],
    [data?.data],
  );

  const activeSubscription = useMemo(
    () => subscriptions.find(sub => sub.status === "ĐANG HOẠT ĐỘNG") ?? null,
    [subscriptions],
  );

  const pendingSubscription = useMemo(
    () => subscriptions.find(sub => sub.status === "ĐANG CHỜ XỬ LÍ") ?? null,
    [subscriptions],
  );

  const canSubscribe = !pendingSubscription && !activeSubscription;

  const subscribe = (payload: CreateSubscriptionPayload) => {
    return subscribeMutation.mutateAsync(payload);
  };

  const activate = (payload: ActivatePayload) => {
    return activateMutation.mutateAsync(payload.id);
  };

  const invalidateSubscriptions = () => {
    queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
  };

  return {
    activate,
    activeSubscription,
    canSubscribe,
    invalidateSubscriptions,
    isActivating: activateMutation.isPending,
    isFetching,
    isLoading,
    pendingSubscription,
    refetch,
    subscribe,
    subscriptions,
  };
}
