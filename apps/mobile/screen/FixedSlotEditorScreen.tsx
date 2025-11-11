import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BikeColors } from "@constants/BikeColors";
import { useCreateFixedSlotTemplateMutation } from "@hooks/mutations/FixedSlots/useCreateFixedSlotTemplateMutation";

import type {
  FixedSlotEditorNavigationProp,
  FixedSlotEditorRouteProp,
} from "@/types/navigation";

function formatTime(date: Date) {
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
}

function formatDate(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function FixedSlotEditorScreen() {
  const navigation = useNavigation<FixedSlotEditorNavigationProp>();
  const route = useRoute<FixedSlotEditorRouteProp>();
  const { stationId: initialStationId, stationName } = route.params ?? {};
  const insets = useSafeAreaInsets();

  const [stationId, setStationId] = useState(initialStationId ?? "");
  const [isStationEditable, setIsStationEditable] = useState(!initialStationId);
  const [slotStart, setSlotStart] = useState(formatTime(new Date()));
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [iosPickerVisible, setIosPickerVisible] = useState(false);
  const [iosPickerMode, setIosPickerMode] = useState<"time" | "date">("time");
  const [iosPickerValue, setIosPickerValue] = useState(new Date());

  const createMutation = useCreateFixedSlotTemplateMutation();

  const handleSelectTime = useCallback(() => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        mode: "time",
        value: new Date(),
        is24Hour: true,
        onChange: (event, date) => {
          if (event.type === "set" && date) {
            setSlotStart(formatTime(date));
          }
        },
      });
      return;
    }
    setIosPickerMode("time");
    setIosPickerValue(new Date());
    setIosPickerVisible(true);
  }, []);

  const handleAddDate = useCallback(() => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        mode: "date",
        value: new Date(),
        minimumDate: new Date(),
        onChange: (event, date) => {
          if (event.type === "set" && date) {
            const value = formatDate(date);
            setSelectedDates((prev) => (prev.includes(value) ? prev : [...prev, value]));
          }
        },
      });
      return;
    }
    setIosPickerMode("date");
    setIosPickerValue(new Date());
    setIosPickerVisible(true);
  }, []);

  const handleSubmit = useCallback(() => {
    const normalizedStationId = stationId.trim();
    if (!normalizedStationId) {
      Alert.alert("Thiếu trạm", "Vui lòng nhập mã trạm trước khi tạo khung giờ.");
      return;
    }
    if (selectedDates.length === 0) {
      Alert.alert("Thiếu ngày", "Cần ít nhất 1 ngày áp dụng.");
      return;
    }

    createMutation.mutate(
      { station_id: normalizedStationId, slot_start: slotStart, selected_dates: selectedDates },
      {
        onSuccess: () => {
          Alert.alert("Thành công", "Đã tạo khung giờ cố định.");
          AsyncStorage.removeItem("fixedSlots:lastCreated").catch(() => {});
          navigation.goBack();
        },
        onError: () => {
          Alert.alert("Lỗi", "Không thể tạo khung giờ. Vui lòng thử lại.");
        },
      },
    );
  }, [stationId, slotStart, selectedDates, createMutation, navigation]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0066FF", "#00B4D8"]}
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
        <Text style={styles.headerTitle}>Tạo khung giờ</Text>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Trạm áp dụng</Text>
          {isStationEditable
            ? (
                <>
                  <TextInput
                    style={styles.input}
                    value={stationId}
                    onChangeText={setStationId}
                    placeholder="Nhập ID trạm"
                  />
                  {stationName && (
                    <Text style={styles.helperText}>
                      Gợi ý: {stationName}
                      {stationId ? ` (ID: ${stationId})` : ""}
                    </Text>
                  )}
                </>
              )
            : (
                <View style={styles.stationSummary}>
                  <Text style={styles.stationSummaryTitle}>
                    {stationName ?? "Trạm đã chọn"}
                  </Text>
                  <Text style={styles.stationSummarySubtitle}>
                    Mã trạm: {stationId}
                  </Text>
                  <TouchableOpacity onPress={() => setIsStationEditable(true)}>
                    <Text style={styles.changeStationLink}>Chọn trạm khác</Text>
                  </TouchableOpacity>
                </View>
              )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Giờ bắt đầu</Text>
          <TouchableOpacity style={styles.selector} onPress={handleSelectTime}>
            <Ionicons name="time-outline" size={18} color={BikeColors.primary} />
            <Text style={styles.selectorText}>{slotStart}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Ngày áp dụng</Text>
            <TouchableOpacity onPress={handleAddDate}>
              <Text style={styles.linkText}>Thêm ngày</Text>
            </TouchableOpacity>
          </View>
          {selectedDates.length === 0
            ? (
                <Text style={styles.helperText}>Bạn chưa chọn ngày nào.</Text>
              )
            : (
                <View style={styles.dateList}>
                  {selectedDates.map((date) => (
                    <View key={date} style={styles.dateChip}>
                      <Text style={styles.dateText}>{date}</Text>
                      <TouchableOpacity
                        onPress={() =>
                          setSelectedDates((prev) => prev.filter((item) => item !== date))}
                      >
                        <Ionicons name="close" size={16} color={BikeColors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleSubmit}
          disabled={createMutation.isPending}
        >
          <Text style={styles.primaryText}>
            {createMutation.isPending ? "Đang tạo..." : "Lưu khung giờ"}
          </Text>
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
              <Text style={styles.modalTitle}>
                {iosPickerMode === "time" ? "Chọn giờ" : "Chọn ngày"}
              </Text>
              <DateTimePicker
                mode={iosPickerMode}
                display="spinner"
                value={iosPickerValue}
                minimumDate={iosPickerMode === "date" ? new Date() : undefined}
                onChange={(_, date) => {
                  if (date)
                    setIosPickerValue(date);
                }}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setIosPickerVisible(false)}>
                  <Text style={styles.linkText}>Đóng</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    if (iosPickerMode === "time") {
                      setSlotStart(formatTime(iosPickerValue));
                    }
                    else {
                      const value = formatDate(iosPickerValue);
                      setSelectedDates((prev) => (prev.includes(value) ? prev : [...prev, value]));
                    }
                    setIosPickerVisible(false);
                  }}
                >
                  <Text style={styles.linkText}>Chọn</Text>
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
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: BikeColors.textPrimary,
    marginBottom: 8,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BikeColors.divider,
    padding: 14,
    fontSize: 15,
    color: BikeColors.textPrimary,
    backgroundColor: "#fff",
  },
  helperText: {
    marginTop: 6,
    color: BikeColors.textSecondary,
  },
  stationSummary: {
    backgroundColor: BikeColors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: BikeColors.divider,
  },
  stationSummaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: BikeColors.textPrimary,
  },
  stationSummarySubtitle: {
    marginTop: 4,
    color: BikeColors.textSecondary,
  },
  changeStationLink: {
    marginTop: 10,
    color: BikeColors.primary,
    fontWeight: "600",
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BikeColors.divider,
    backgroundColor: "#fff",
  },
  selectorText: {
    fontSize: 16,
    fontWeight: "600",
    color: BikeColors.textPrimary,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  linkText: {
    color: BikeColors.primary,
    fontWeight: "600",
  },
  dateList: {
    marginTop: 12,
    gap: 8,
  },
  dateChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: BikeColors.surface,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dateText: {
    fontSize: 15,
    color: BikeColors.textPrimary,
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
  primaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    borderRadius: 20,
    backgroundColor: "#fff",
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 12,
  },
});
