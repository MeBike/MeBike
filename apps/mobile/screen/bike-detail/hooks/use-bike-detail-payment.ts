import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

import type { BikeDetailNavigationProp } from "@/types/navigation";
import type { Subscription } from "@/types/subscription-types";

import type { PaymentMode } from "../types";

type UseBikeDetailPaymentArgs = {
  activeSubscriptions: Subscription[];
  canUseSubscription: boolean;
  navigation: BikeDetailNavigationProp;
};

function showSubscriptionRequiredAlert(navigation: BikeDetailNavigationProp) {
  Alert.alert(
    "Chưa có gói tháng",
    "Bạn cần đăng ký gói tháng trước khi sử dụng hình thức này.",
    [
      { text: "Để sau", style: "cancel" },
      {
        text: "Xem gói tháng",
        onPress: () => navigation.navigate("Subscriptions"),
      },
    ],
  );
}

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
