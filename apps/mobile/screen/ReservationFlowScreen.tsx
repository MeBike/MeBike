import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ReservationInfoCard } from "../components/reservation-flow/ReservationInfoCard";
import {
  ReservationMode,
  ReservationModeToggle,
} from "../components/reservation-flow/ReservationModeToggle";
import { BikeColors } from "@constants/BikeColors";
import { useGetSubscriptionsQuery } from "@hooks/query/Subscription/useGetSubscriptionsQuery";
import { useReservationActions } from "@hooks/useReservationActions";
import { useAuthNext } from "@providers/auth-provider-next";

import type {
  ReservationFlowNavigationProp,
  ReservationFlowRouteProp,
} from "@/types/navigation";
import type { SubscriptionListItem } from "@/types/subscription-types";

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

export default function ReservationFlowScreen() {
  const navigation = useNavigation<ReservationFlowNavigationProp>();
  const route = useRoute<ReservationFlowRouteProp>();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuthNext();
  const hasToken = isAuthenticated;
  const {
    stationId,
    stationName,
    stationAddress,
    bikeId,
    bikeName,
    initialMode,
    initialSubscriptionId,
    lockPaymentSelection = false,
  } = route.params;

  const [mode, setMode] = useState<ReservationMode>(initialMode ?? "MỘT LẦN");
  const [scheduledAt, setScheduledAt] = useState<Date>(() => new Date(Date.now() + 5 * 60 * 1000));
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(
    initialSubscriptionId ?? null,
  );
  const [iosPickerVisible, setIosPickerVisible] = useState(false);
  const [iosPickerValue, setIosPickerValue] = useState<Date>(scheduledAt);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createReservation } = useReservationActions({
    hasToken,
    autoFetch: false,
  });

  const {
    data: subscriptionResponse,
    refetch: refetchSubscriptions,
  } = useGetSubscriptionsQuery(
    { status: "ĐANG HOẠT ĐỘNG", limit: 10 },
    hasToken,
  );

  const activeSubscriptions = useMemo(
    () => subscriptionResponse?.data.filter((item) => item.status === "ĐANG HOẠT ĐỘNG") ?? [],
    [subscriptionResponse],
  );

  useEffect(() => {
    if (lockPaymentSelection || initialMode)
      return;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (value && (MODE_OPTIONS.some((option) => option.key === value))) {
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
      const stillExists = activeSubscriptions.some((item) => item._id === selectedSubscriptionId);
      if (stillExists)
        return;
    }
    if (initialSubscriptionId && activeSubscriptions.some((item) => item._id === initialSubscriptionId)) {
      setSelectedSubscriptionId(initialSubscriptionId);
      return;
    }
    if (activeSubscriptions.length > 0) {
      setSelectedSubscriptionId(activeSubscriptions[0]._id);
    }
  }, [activeSubscriptions, initialSubscriptionId, mode, selectedSubscriptionId]);

  const subscriptionsLoaded = subscriptionResponse !== undefined;

  useEffect(() => {
    if (!subscriptionsLoaded)
      return;
    if (mode === "GÓI THÁNG" && activeSubscriptions.length === 0) {
      setMode("MỘT LẦN");
      setSelectedSubscriptionId(null);
    }
  }, [activeSubscriptions.length, mode, subscriptionsLoaded]);

  useFocusEffect(
    useCallback(() => {
      if (hasToken) {
        refetchSubscriptions();
      }
    }, [hasToken, refetchSubscriptions]),
  );

  const modeOptions = useMemo(
    () =>
      MODE_OPTIONS.map((option) => ({
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

  const selectedSubscription: SubscriptionListItem | undefined = useMemo(
    () => activeSubscriptions.find((item) => item._id === selectedSubscriptionId),
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

    if (mode === "GÓI THÁNG" && !selectedSubscription?._id) {
      Alert.alert("Thiếu gói tháng", "Vui lòng chọn một gói tháng đang hoạt động.");
      return;
    }

    setIsSubmitting(true);
    createReservation(bikeId, scheduledAt.toISOString(), {
      reservationOption: mode,
      subscriptionId: mode === "GÓI THÁNG" ? selectedSubscription?._id : undefined,
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
    scheduledAt,
    selectedSubscription,
    navigation,
    hasToken,
  ]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0066FF", "#00B4D8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTextGroup}>
          <Text style={styles.headerTitle}>Đặt xe</Text>
          <Text style={styles.headerSubtitle}>
            Chọn hình thức giữ xe phù hợp
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <ReservationInfoCard
            stationName={stationName}
            stationAddress={stationAddress}
            bikeName={bikeName}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hình thức đặt</Text>
          <ReservationModeToggle
            value={mode}
            options={modeOptions}
            onChange={handleModeChange}
          />
          {lockPaymentSelection && (
            <Text style={styles.helperText}>
              Phương thức thanh toán đã được chọn ở màn hình trước.
            </Text>
          )}
          {mode === "GÓI THÁNG" && activeSubscriptions.length === 0 && (
            <Text style={styles.helperText}>
              Bạn chưa có gói tháng hoạt động.{" "}
              <Text
                style={styles.linkText}
                onPress={() => navigation.navigate("Subscriptions")}
              >
                Đăng ký ngay
              </Text>
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thời gian giữ xe</Text>
          <TouchableOpacity
            style={styles.timePickerButton}
            onPress={handleOpenTimePicker}
            activeOpacity={0.9}
          >
            <Ionicons
              name="time-outline"
              size={20}
              color={BikeColors.primary}
            />
            <Text style={styles.timeText}>{formatVietnamTime(scheduledAt)}</Text>
          </TouchableOpacity>
        </View>

        {mode === "GÓI THÁNG" && activeSubscriptions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gói tháng</Text>
            {activeSubscriptions.map((subscription) => {
              const remaining = subscription.max_usages != null
                ? Math.max(0, subscription.max_usages - subscription.usage_count)
                : null;
              return (
                <TouchableOpacity
                  key={subscription._id}
                  style={[
                    styles.subscriptionCard,
                    subscription._id === selectedSubscriptionId && styles.subscriptionCardActive,
                    lockPaymentSelection && styles.subscriptionCardLocked,
                  ]}
                  onPress={
                    lockPaymentSelection
                      ? undefined
                      : () => setSelectedSubscriptionId(subscription._id)
                  }
                  disabled={lockPaymentSelection}
                >
                  <View>
                    <Text style={styles.subscriptionName}>
                      {subscription.package_name.toUpperCase()}
                    </Text>
                    {remaining != null
                      ? (
                          <Text style={styles.subscriptionMeta}>
                            {remaining} / {subscription.max_usages} lượt còn lại
                          </Text>
                        )
                      : (
                          <Text style={styles.subscriptionMeta}>
                            Không giới hạn lượt
                          </Text>
                        )}
                  </View>
                  <Ionicons
                    name={subscription._id === selectedSubscriptionId
                      ? "checkmark-circle"
                      : "ellipse-outline"}
                    size={22}
                    color={BikeColors.primary}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.9}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {mode === "GÓI THÁNG" ? "Dùng gói tháng" : "Đặt 1 lần"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {Platform.OS === "ios" && (
        <Modal
          visible={iosPickerVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setIosPickerVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Chọn thời gian giữ xe</Text>
              <DateTimePicker
                display="spinner"
                mode="datetime"
                value={iosPickerValue}
                minimumDate={new Date()}
                onChange={(_, date) => {
                  if (date)
                    setIosPickerValue(date);
                }}
                style={styles.iosPicker}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setIosPickerVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalPrimaryButton]}
                  onPress={handleConfirmIOSPicker}
                >
                  <Text style={[styles.modalButtonText, styles.modalPrimaryText]}>
                    Xác nhận
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BikeColors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  headerSubtitle: {
    marginTop: 4,
    color: "rgba(255,255,255,0.85)",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  section: {
    marginBottom: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: BikeColors.textPrimary,
  },
  helperText: {
    fontSize: 14,
    color: BikeColors.textSecondary,
  },
  linkText: {
    color: BikeColors.primary,
    fontWeight: "600",
  },
  timePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BikeColors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  timeText: {
    fontSize: 15,
    fontWeight: "500",
    color: BikeColors.textPrimary,
  },
  subscriptionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    backgroundColor: BikeColors.surface,
    borderWidth: 1,
    borderColor: "transparent",
  },
  subscriptionCardActive: {
    borderColor: BikeColors.primary,
  },
  subscriptionCardLocked: {
    opacity: 0.7,
  },
  subscriptionName: {
    fontSize: 16,
    fontWeight: "600",
    color: BikeColors.textPrimary,
  },
  subscriptionMeta: {
    fontSize: 13,
    color: BikeColors.textSecondary,
    marginTop: 4,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderColor: BikeColors.divider,
    backgroundColor: "#fff",
  },
  primaryButton: {
    backgroundColor: BikeColors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: BikeColors.textPrimary,
  },
  iosPicker: {
    width: "100%",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 12,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: BikeColors.surface,
  },
  modalButtonText: {
    color: BikeColors.textPrimary,
    fontWeight: "600",
  },
  modalPrimaryButton: {
    backgroundColor: BikeColors.primary,
  },
  modalPrimaryText: {
    color: "#fff",
  },
});
