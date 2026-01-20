import React from "react";

import type { SubscriptionListItem } from "@/types/subscription-types";

import { SubscriptionSummary } from "@components/subscription/subscription-summary";

type Props = {
  activeSubscription: SubscriptionListItem | null;
  pendingSubscription: SubscriptionListItem | null;
  onActivatePending?: () => void;
  activating: boolean;
};

export function SubscriptionSummarySection({
  activeSubscription,
  pendingSubscription,
  onActivatePending,
  activating,
}: Props) {
  return (
    <SubscriptionSummary
      activeSubscription={activeSubscription}
      pendingSubscription={pendingSubscription}
      onActivatePending={onActivatePending}
      activating={activating}
    />
  );
}
