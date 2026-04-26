import { useCallback, useEffect, useState } from "react";

import type { BikeDetailNavigationProp } from "@/types/navigation";
import type { Subscription } from "@/types/subscription-types";

import type { PaymentMode } from "../types";
import { showSubscriptionRequiredAlert } from "../helpers/create-rental-alerts";

type UseBikeDetailPaymentArgs = {
  activeSubscriptions: Subscription[];
  canUseSubscription: boolean;
  navigation: BikeDetailNavigationProp;
};

export function useBikeDetailPayment({
  activeSubscriptions,
  canUseSubscription,
  navigation,
}: UseBikeDetailPaymentArgs) {
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("wallet");
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null);

  useEffect(() => {
    if (!canUseSubscription) {
      setPaymentMode("wallet");
      setSelectedSubscriptionId(null);
      return;
    }

    if (paymentMode === "subscription") {
      const stillValid = activeSubscriptions.some(subscription => subscription.id === selectedSubscriptionId);
      if (!stillValid) {
        setSelectedSubscriptionId(activeSubscriptions[0]?.id ?? null);
      }
    }
  }, [activeSubscriptions, canUseSubscription, paymentMode, selectedSubscriptionId]);

  const handleSelectPaymentMode = useCallback((mode: PaymentMode) => {
    if (mode === "subscription" && !canUseSubscription) {
      showSubscriptionRequiredAlert(navigation);
      return;
    }

    setPaymentMode(mode);
  }, [canUseSubscription, navigation]);

  return {
    paymentMode,
    selectedSubscriptionId,
    setSelectedSubscriptionId,
    handleSelectPaymentMode,
  };
}
