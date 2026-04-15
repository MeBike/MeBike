import { useNavigation, useRoute } from "@react-navigation/native";
import { borderWidths, elevations, spaceScale, spacing } from "@theme/metrics";
import { AppHeroHeader } from "@ui/patterns/app-hero-header";
import { AppButton } from "@ui/primitives/app-button";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
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
  const contentBottomInset = insets.bottom + spacing.xxxxl + spacing.xxxl;

  return (
    <Screen tone="subtle">
      <ScrollView
        contentContainerStyle={{
          paddingBottom: contentBottomInset,
        }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <YStack>
          <AppHeroHeader
            onBack={() => navigation.goBack()}
            size="compact"
            subtitle={isEditMode ? resolvedStationName : stationName}
            title={headerTitle}
            variant="gradient"
          />

          {isEditMode && isDetailLoading
            ? (
                <Screen alignItems="center" justifyContent="center" minHeight={320} tone="subtle">
                  <ActivityIndicator color={theme.actionPrimary.val} size="large" />
                  <AppText tone="muted" variant="bodySmall">Đang tải thông tin khung giờ...</AppText>
                </Screen>
              )
            : (
                <YStack gap="$4" marginTop={-spaceScale[6]} paddingHorizontal="$5">
                  <AppCard
                    borderColor="$borderSubtle"
                    borderRadius="$5"
                    borderWidth={borderWidths.subtle}
                    chrome="flat"
                    gap="$4"
                    style={elevations.whisper}
                  >
                    <StationSection
                      stationId={stationId}
                      stationName={stationName}
                      resolvedStationName={resolvedStationName}
                      canEdit={canEditStation}
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

                  <AppCard borderColor="$borderSubtle" borderWidth={1} borderRadius="$4" chrome="flat" gap="$3" tone="warning">
                    <XStack alignItems="flex-start" gap="$3">
                      <IconSymbol color={theme.textWarning.val} name="warning" size="md" />
                      <AppText flex={1} tone="warning" variant="bodySmall">
                        Lưu ý: Tạo lịch không trừ tiền ngay. Phí chỉ được trừ khi hệ thống tạo đặt trước cho từng ngày đã chọn.
                      </AppText>
                    </XStack>
                  </AppCard>
                </YStack>
              )}
        </YStack>
      </ScrollView>

      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
        <AppCard
          borderTopColor="$borderSubtle"
          borderTopWidth={1}
          borderRadius="$0"
          chrome="flat"
          padding="$4"
          paddingBottom={insets.bottom + spacing.lg}
        >
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
