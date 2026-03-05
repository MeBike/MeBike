import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";

import { ReservationInfoCard } from "@components/reservation-flow/ReservationInfoCard";
import { ReservationModeToggle } from "@components/reservation-flow/ReservationModeToggle";
import { BikeColors } from "@constants/BikeColors";

import { IosDateTimeModal } from "./components/ios-datetime-modal";
import { ReservationFlowHeader } from "./components/reservation-flow-header";
import { ReservationSubmitFooter } from "./components/reservation-submit-footer";
import { ReservationTimePicker } from "./components/reservation-time-picker";
import { SubscriptionSelection } from "./components/subscription-selection";
import { useReservationFlow } from "./hooks/use-reservation-flow";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BikeColors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  contentContainer: {
    paddingBottom: 48,
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
});

export default function ReservationFlowScreen() {
  const {
    insets,
    navigation,
    stationName,
    stationAddress,
    bikeName,
    lockPaymentSelection,
    mode,
    modeOptions,
    handleModeChange,
    activeSubscriptions,
    selectedSubscriptionId,
    setSelectedSubscriptionId,
    scheduledAt,
    minimumScheduledAt,
    formatVietnamTime,
    handleOpenTimePicker,
    iosPickerVisible,
    setIosPickerVisible,
    iosPickerValue,
    setIosPickerValue,
    handleConfirmIOSPicker,
    isSubmitting,
    handleSubmit,
  } = useReservationFlow();

  return (
    <View style={styles.container}>
      <ReservationFlowHeader
        topInset={insets.top}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
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
              Bạn chưa có gói tháng hoạt động.
              {" "}
              <Text
                style={styles.linkText}
                onPress={() => navigation.navigate("Subscriptions")}
              >
                Đăng ký ngay
              </Text>
            </Text>
          )}
        </View>

        <ReservationTimePicker
          formattedTime={formatVietnamTime(scheduledAt)}
          onOpen={handleOpenTimePicker}
        />

        {mode === "GÓI THÁNG" && (
          <SubscriptionSelection
            subscriptions={activeSubscriptions}
            selectedSubscriptionId={selectedSubscriptionId}
            lockPaymentSelection={lockPaymentSelection}
            onSelect={setSelectedSubscriptionId}
          />
        )}
      </ScrollView>

      <ReservationSubmitFooter
        mode={mode}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />

      {Platform.OS === "ios" && (
        <IosDateTimeModal
          visible={iosPickerVisible}
          value={iosPickerValue}
          minimumDate={minimumScheduledAt}
          onClose={() => setIosPickerVisible(false)}
          onChange={setIosPickerValue}
          onConfirm={handleConfirmIOSPicker}
        />
      )}
    </View>
  );
}
