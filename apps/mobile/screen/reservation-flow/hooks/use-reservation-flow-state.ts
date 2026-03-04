import AsyncStorage from "@react-native-async-storage/async-storage";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

import type { Subscription } from "@/types/subscription-types";
import type { ReservationMode } from "@components/reservation-flow/ReservationModeToggle";

const STORAGE_KEY = "reservationFlow:lastMode";

const MODE_OPTIONS: Array<{
  key: ReservationMode;
  title: string;
  subtitle: string;
}> = [
  { key: "MỘT LẦN", title: "Đặt 1 lần", subtitle: "Trừ tiền ví" },
  { key: "GÓI THÁNG", title: "Dùng gói tháng", subtitle: "Trừ lượt đã mua" },
];

function formatVietnamTime(date: Date) {
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(date);
  }
  catch {
    return date.toISOString();
  }
}

type UseReservationFlowStateParams = {
  initialMode?: ReservationMode;
  initialSubscriptionId?: string;
  lockPaymentSelection?: boolean;
  activeSubscriptions: Subscription[];
  subscriptionsLoaded: boolean;
};

export function useReservationFlowState({
  initialMode,
  initialSubscriptionId,
  lockPaymentSelection = false,
  activeSubscriptions,
  subscriptionsLoaded,
}: UseReservationFlowStateParams) {
  const [mode, setMode] = useState<ReservationMode>(initialMode ?? "MỘT LẦN");
  const [scheduledAt, setScheduledAt] = useState<Date>(() => new Date(Date.now() + 5 * 60 * 1000));
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(
    initialSubscriptionId ?? null,
  );
  const [iosPickerVisible, setIosPickerVisible] = useState(false);
  const [iosPickerValue, setIosPickerValue] = useState<Date>(scheduledAt);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (lockPaymentSelection || initialMode)
      return;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (value && (MODE_OPTIONS.some(option => option.key === value))) {
          setMode(value as ReservationMode);
        }
      })
      .catch(() => {});
  }, [initialMode, lockPaymentSelection]);

  const handleModeChange = useCallback(
    (nextMode: ReservationMode) => {
      if (lockPaymentSelection)
        return;
      setMode(nextMode);
      AsyncStorage.setItem(STORAGE_KEY, nextMode).catch(() => {});
    },
    [lockPaymentSelection],
  );

  useEffect(() => {
    if (mode !== "GÓI THÁNG")
      return;
    if (selectedSubscriptionId) {
      const stillExists = activeSubscriptions.some(item => item.id === selectedSubscriptionId);
      if (stillExists)
        return;
    }
    if (initialSubscriptionId && activeSubscriptions.some(item => item.id === initialSubscriptionId)) {
      setSelectedSubscriptionId(initialSubscriptionId);
      return;
    }
    if (activeSubscriptions.length > 0) {
      setSelectedSubscriptionId(activeSubscriptions[0].id);
    }
  }, [activeSubscriptions, initialSubscriptionId, mode, selectedSubscriptionId]);

  useEffect(() => {
    if (!subscriptionsLoaded)
      return;
    if (mode === "GÓI THÁNG" && activeSubscriptions.length === 0) {
      setMode("MỘT LẦN");
      setSelectedSubscriptionId(null);
    }
  }, [activeSubscriptions.length, mode, subscriptionsLoaded]);

  const modeOptions = useMemo(
    () =>
      MODE_OPTIONS.map(option => ({
        ...option,
        disabled:
          lockPaymentSelection
          || (option.key === "GÓI THÁNG" && activeSubscriptions.length === 0),
      })),
    [activeSubscriptions.length, lockPaymentSelection],
  );

  const handleOpenTimePicker = useCallback(() => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        mode: "date",
        value: scheduledAt,
        minimumDate: new Date(),
        onChange: (event, date) => {
          if (event.type !== "set" || !date)
            return;
          DateTimePickerAndroid.open({
            mode: "time",
            value: scheduledAt,
            is24Hour: true,
            onChange: (timeEvent, timeValue) => {
              if (timeEvent.type !== "set" || !timeValue)
                return;
              const finalDate = new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate(),
                timeValue.getHours(),
                timeValue.getMinutes(),
              );
              setScheduledAt(finalDate);
            },
          });
        },
      });
      return;
    }

    setIosPickerValue(scheduledAt);
    setIosPickerVisible(true);
  }, [scheduledAt]);

  const handleConfirmIOSPicker = useCallback(() => {
    setScheduledAt(iosPickerValue);
    setIosPickerVisible(false);
  }, [iosPickerValue]);

  return {
    lockPaymentSelection,
    mode,
    modeOptions,
    handleModeChange,
    activeSubscriptions,
    selectedSubscriptionId,
    setSelectedSubscriptionId,
    scheduledAt,
    formatVietnamTime,
    handleOpenTimePicker,
    iosPickerVisible,
    setIosPickerVisible,
    iosPickerValue,
    setIosPickerValue,
    handleConfirmIOSPicker,
    isSubmitting,
    setIsSubmitting,
  };
}
