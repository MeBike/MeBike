import { useNavigation, useRoute } from "@react-navigation/native";
import { AppButton } from "@ui/primitives/app-button";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { AppHeroHeader } from "@ui/patterns/app-hero-header";
import { Screen } from "@ui/primitives/screen";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, XStack, YStack } from "tamagui";

import type {
  FixedSlotEditorNavigationProp,
  FixedSlotEditorRouteProp,
} from "@/types/navigation";
import { IconSymbol } from "@/components/IconSymbol";

import { DatePickerModal } from "./fixed-slot-editor/components/date-picker-modal";
import { SelectedDatesSection } from "./fixed-slot-editor/components/selected-dates-section";
import { StationSection } from "./fixed-slot-editor/components/station-section";
import { TimePickerModal } from "./fixed-slot-editor/components/time-picker-modal";
import { TimeSelectionSection } from "./fixed-slot-editor/components/time-selection-section";
import { useFixedSlotEditor } from "./fixed-slot-editor/use-fixed-slot-editor";

export default function FixedSlotEditorScreen() {
  const navigation = useNavigation<FixedSlotEditorNavigationProp>();
  const route = useRoute<FixedSlotEditorRouteProp>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const {
    headerTitle,
    submitLabel,
    isMutating,
    isEditMode,
    isDetailLoading,
    stationId,
    setStationId,
    resolvedStationName,
    slotStart,
    selectedDates,
    pastDatesHidden,
    handleSelectTime,
    removeDate,
    handleSubmit,
    handleAddDate,
    dateModalVisible,
    datePickerValue,
    handleDatePickerChange,
    confirmDatePicker,
    cancelDatePicker,
    timePickerVisible,
    timePickerValue,
    handleTimePickerChange,
    confirmTimePicker,
    cancelTimePicker,
    stationName,
    canEditStation,
  } = useFixedSlotEditor({ navigation, routeParams: route.params });

  const summaryTitle = isEditMode ? "Cập nhật lịch đặt" : "Tổng thanh toán";
  const summarySubtitle = isEditMode
    ? "Các ngày mới thêm sẽ được trừ lượt hoặc số dư ngay khi lưu."
    : `${selectedDates.length} ngày đã chọn cho khung giờ này.`;

  return (
    <Screen tone="subtle">
      <AppHeroHeader
        onBack={() => navigation.goBack()}
        size="compact"
        subtitle={isEditMode ? resolvedStationName : stationName}
        title={headerTitle}
        variant="gradient"
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 180 }} style={{ marginTop: -24 }}>
        {isEditMode && isDetailLoading
          ? (
              <Screen alignItems="center" justifyContent="center" minHeight={320} tone="subtle">
                <ActivityIndicator color={theme.actionPrimary.val} size="large" />
                <AppText tone="muted" variant="bodySmall">Đang tải thông tin khung giờ...</AppText>
              </Screen>
            )
          : (
              <YStack gap="$4">
                <AppCard borderColor="$borderSubtle" borderWidth={1} borderRadius="$5" chrome="card" gap="$4">
                  <StationSection
                    stationId={stationId}
                    stationName={stationName}
                    resolvedStationName={resolvedStationName}
                    canEdit={canEditStation}
                    isEditMode={isEditMode}
                    onChangeStationId={setStationId}
                  />

                  <TimeSelectionSection slotStart={slotStart} onSelectTime={handleSelectTime} />
                </AppCard>

                <SelectedDatesSection
                  selectedDates={selectedDates}
                  pastDatesHidden={pastDatesHidden}
                  onAddDate={handleAddDate}
                  onRemoveDate={removeDate}
                />

                <AppCard borderColor="$surfaceInverse" borderWidth={1} borderRadius="$5" chrome="flat" gap="$4" tone="inverse">
                  <XStack alignItems="center" gap="$2">
                    <IconSymbol color={theme.onSurfaceBrand.val} name="credit-card" size="sm" />
                    <AppText tone="inverted" variant="bodyStrong">{summaryTitle}</AppText>
                  </XStack>
                  <XStack alignItems="flex-end" justifyContent="space-between">
                    <YStack flex={1} gap="$1">
                      <AppText opacity={0.86} tone="inverted" variant="bodySmall">{summarySubtitle}</AppText>
                      <AppText opacity={0.72} tone="inverted" variant="caption">
                        Thanh toán được xử lý ngay khi xác nhận tạo hoặc thêm ngày mới.
                      </AppText>
                    </YStack>
                    <AppText tone="inverted" variant="headline">{selectedDates.length} ngày</AppText>
                  </XStack>
                </AppCard>

                <AppCard borderColor="$borderSubtle" borderWidth={1} borderRadius="$4" chrome="flat" gap="$3" tone="danger">
                  <XStack alignItems="flex-start" gap="$3">
                    <IconSymbol color={theme.textDanger.val} name="warning" size="md" />
                    <AppText flex={1} tone="danger" variant="bodySmall">
                      Lưu ý: Sau khi xác nhận, việc xóa ngày lẻ hoặc hủy các ngày đã đặt sẽ không được hoàn tiền.
                    </AppText>
                  </XStack>
                </AppCard>
              </YStack>
            )}
      </ScrollView>

      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
        <AppCard borderTopColor="$borderSubtle" borderTopWidth={1} borderRadius="$0" chrome="flat" padding="$4" paddingBottom={insets.bottom + 16}>
          <AppButton
            disabled={isMutating || (isEditMode && isDetailLoading)}
            loading={isMutating}
            onPress={handleSubmit}
            tone="primary"
          >
            {submitLabel}
          </AppButton>
        </AppCard>
      </View>

      {Platform.OS !== "android" && (
        <DatePickerModal
          visible={dateModalVisible}
          value={datePickerValue}
          onChange={handleDatePickerChange}
          onConfirm={confirmDatePicker}
          onClose={cancelDatePicker}
        />
      )}

      {Platform.OS === "ios" && (
        <TimePickerModal
          visible={timePickerVisible}
          value={timePickerValue}
          onChange={handleTimePickerChange}
          onConfirm={confirmTimePicker}
          onClose={cancelTimePicker}
          />
      )}
    </Screen>
  );
}
