import type { ReservationMode } from "@components/reservation-flow/ReservationModeToggle";

import { useCallback, useMemo } from "react";
import { Alert } from "react-native";

import type { ReservationFlowNavigationProp } from "@/types/navigation";
import type { Subscription } from "@/types/subscription-types";

function getMinimumReservationDate() {
  const now = new Date();
  now.setSeconds(0, 0);
  return now;
}

type UseReservationFlowSubmitParams = {
  bikeId?: string;
  stationId: string;
  mode: ReservationMode;
  scheduledAt: Date;
  selectedSubscriptionId: string | null;
  activeSubscriptions: Subscription[];
  hasToken: boolean;
  navigation: ReservationFlowNavigationProp;
  createReservation: (
    bikeId: string,
    stationId: string,
    startTime?: string,
    options?: {
      reservationOption?: ReservationMode;
      subscriptionId?: string;
      callbacks?: {
        onSuccess?: () => void;
        onError?: (message: string) => void;
      };
    },
  ) => void;
  setIsSubmitting: (value: boolean) => void;
};

export function useReservationFlowSubmit({
  bikeId,
  stationId,
  mode,
  scheduledAt,
  selectedSubscriptionId,
  activeSubscriptions,
  hasToken,
  navigation,
  createReservation,
  setIsSubmitting,
}: UseReservationFlowSubmitParams) {
  const selectedSubscription = useMemo(
    () => activeSubscriptions.find(item => item.id === selectedSubscriptionId),
    [activeSubscriptions, selectedSubscriptionId],
  );

  const handleSubmit = useCallback(() => {
    if (!bikeId) {
      Alert.alert("Chưa chọn xe", "Vui lòng quay lại để chọn xe trước khi đặt.");
      return;
    }

    if (!hasToken) {
      Alert.alert("Yêu cầu đăng nhập", "Vui lòng đăng nhập để tiếp tục đặt xe.");
      navigation.navigate("Login" as never);
      return;
    }

    if (mode === "GÓI THÁNG" && !selectedSubscription?.id) {
      Alert.alert("Thiếu gói tháng", "Vui lòng chọn một gói tháng đang hoạt động.");
      return;
    }

    const minimumDate = getMinimumReservationDate();
    if (scheduledAt.getTime() < minimumDate.getTime()) {
      Alert.alert("Thời gian không hợp lệ", "Vui lòng chọn thời gian hiện tại hoặc trong tương lai.");
      return;
    }

    setIsSubmitting(true);
    createReservation(bikeId, stationId, scheduledAt.toISOString(), {
      reservationOption: mode,
      subscriptionId: mode === "GÓI THÁNG" ? selectedSubscription?.id : undefined,
      callbacks: {
        onSuccess: () => {
          setIsSubmitting(false);
          navigation.goBack();
        },
        onError: (_message?: string) => setIsSubmitting(false),
      },
    });
  }, [
    bikeId,
    createReservation,
    mode,
    navigation,
    scheduledAt,
    selectedSubscription,
    setIsSubmitting,
    stationId,
    hasToken,
  ]);

  return {
    handleSubmit,
  };
}
