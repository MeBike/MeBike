import { useEffect, useMemo, useState } from "react";

import type { SubscriptionListItem } from "../../../types/subscription-types";

export type PaymentMode = "wallet" | "subscription";

export function useBikePaymentSelection(
  activeSubscriptions: SubscriptionListItem[],
) {
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("wallet");
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<
    string | null
  >(null);

  const canUseSubscription = activeSubscriptions.length > 0;

  useEffect(() => {
    if (!canUseSubscription) {
      setPaymentMode("wallet");
      setSelectedSubscriptionId(null);
      return;
    }
    if (paymentMode === "subscription") {
      const stillValid = activeSubscriptions.some(
        subscription => subscription._id === selectedSubscriptionId,
      );
      if (!stillValid) {
        setSelectedSubscriptionId(activeSubscriptions[0]?._id ?? null);
      }
    }
  }, [
    activeSubscriptions,
    canUseSubscription,
    paymentMode,
    selectedSubscriptionId,
  ]);

  const remainingById = useMemo(() => {
    return activeSubscriptions.reduce<Record<string, number | null>>(
      (acc, subscription) => {
        const remaining
          = subscription.max_usages != null
            ? Math.max(0, subscription.max_usages - subscription.usage_count)
            : null;
        acc[subscription._id] = remaining;
        return acc;
      },
      {},
    );
  }, [activeSubscriptions]);

  return {
    canUseSubscription,
    paymentMode,
    remainingById,
    selectedSubscriptionId,
    setPaymentMode,
    setSelectedSubscriptionId,
  };
}
