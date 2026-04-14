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
import { useTheme, YStack } from "tamagui";

import type {
  FixedSlotEditorNavigationProp,
  FixedSlotEditorRouteProp,
} from "@/types/navigation";

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

  return (
    <Screen tone="subtle">
      <AppHeroHeader
        onBack={() => navigation.goBack()}
        size="compact"
        subtitle={isEditMode ? resolvedStationName : stationName}
        title={headerTitle}
        variant="surface"
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {isEditMode && isDetailLoading
          ? (
              <Screen alignItems="center" justifyContent="center" minHeight={320} tone="subtle">
                <ActivityIndicator color={theme.actionPrimary.val} size="large" />
                <AppText tone="muted" variant="bodySmall">Đang tải thông tin khung giờ...</AppText>
              </Screen>
            )
          : (
              <YStack gap="$4">
                <AppCard borderColor="$borderSubtle" borderWidth={1} borderRadius="$5" chrome="flat" gap="$4">
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
              </YStack>
            )}
      </ScrollView>

      <View>
        <AppCard borderTopColor="$borderSubtle" borderTopWidth={1} borderRadius="$0" chrome="flat" padding="$4">
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
