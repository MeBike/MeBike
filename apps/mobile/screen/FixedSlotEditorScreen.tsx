import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BikeColors } from "@constants/BikeColors";

import { DatePickerModal } from "./fixed-slot-editor/components/DatePickerModal";
import { SelectedDatesSection } from "./fixed-slot-editor/components/SelectedDatesSection";
import { StationSection } from "./fixed-slot-editor/components/StationSection";
import { TimePickerModal } from "./fixed-slot-editor/components/TimePickerModal";
import { TimeSelectionSection } from "./fixed-slot-editor/components/TimeSelectionSection";
import { useFixedSlotEditor } from "./fixed-slot-editor/useFixedSlotEditor";

import type {
  FixedSlotEditorNavigationProp,
  FixedSlotEditorRouteProp,
} from "@/types/navigation";

export default function FixedSlotEditorScreen() {
  const navigation = useNavigation<FixedSlotEditorNavigationProp>();
  const route = useRoute<FixedSlotEditorRouteProp>();
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

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[BikeColors.primary, BikeColors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <Ionicons
          name="chevron-back"
          size={24}
          color="#fff"
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerTitle}>{headerTitle}</Text>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        {isEditMode && isDetailLoading
          ? (
              <View style={styles.formLoader}>
                <ActivityIndicator color={BikeColors.primary} size="large" />
                <Text style={styles.loaderText}>Đang tải thông tin khung giờ...</Text>
              </View>
            )
          : (
              <>
                <StationSection
                  stationId={stationId}
                  stationName={stationName}
                  resolvedStationName={resolvedStationName}
                  canEdit={canEditStation}
                  isEditMode={isEditMode}
                  onChangeStationId={setStationId}
                />

                <TimeSelectionSection slotStart={slotStart} onSelectTime={handleSelectTime} />

                <SelectedDatesSection
                  selectedDates={selectedDates}
                  pastDatesHidden={pastDatesHidden}
                  onAddDate={handleAddDate}
                  onRemoveDate={removeDate}
                />
              </>
            )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryButton, (isMutating || (isEditMode && isDetailLoading)) && styles.primaryButtonDisabled]}
          onPress={handleSubmit}
          disabled={isMutating || (isEditMode && isDetailLoading)}
        >
          <Text style={styles.primaryText}>{submitLabel}</Text>
        </TouchableOpacity>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BikeColors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formLoader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  loaderText: {
    color: BikeColors.textSecondary,
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
  primaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
