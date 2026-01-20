import { SubscriptionHistorySection } from "@components/subscription/subscription-history-section";
import React from "react";

import type { SubscriptionListItem } from "@/types/subscription-types";

type Props = {
  subscriptions: SubscriptionListItem[];
  isLoading: boolean;
  onSelect: (id: string | undefined) => void;
};

export function SubscriptionHistoryList({
  subscriptions,
  isLoading,
  onSelect,
}: Props) {
  return (
    <SubscriptionHistorySection
      subscriptions={subscriptions}
      isLoading={isLoading}
      onSelect={onSelect}
    />
  );
}
