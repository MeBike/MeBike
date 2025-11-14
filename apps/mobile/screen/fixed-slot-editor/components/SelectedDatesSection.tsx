import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { BikeColors } from "@constants/BikeColors";

type Props = {
  selectedDates: string[];
  pastDatesHidden: number;
  onAddDate: () => void;
  onRemoveDate: (date: string) => void;
};

export function SelectedDatesSection({ selectedDates, pastDatesHidden, onAddDate, onRemoveDate }: Props) {
  const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
      return value;
    const day = `${date.getDate()}`.padStart(2, "0");
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.rowBetween}>
        <Text style={styles.label}>Ngày áp dụng</Text>
        <TouchableOpacity onPress={onAddDate}>
          <Text style={styles.linkText}>Thêm ngày</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.helper}>Chỉ chọn các ngày bắt đầu từ ngày mai để đảm bảo chuẩn bị.</Text>
      {pastDatesHidden > 0 && (
        <Text style={styles.helper}>{`Đã ẩn ${pastDatesHidden} ngày cũ khỏi danh sách.`}</Text>
      )}
      {selectedDates.length === 0 ? (
        <Text style={styles.helper}>Bạn chưa chọn ngày nào.</Text>
      ) : (
        <View style={styles.dateList}>
              {selectedDates.map((date) => (
                <View key={date} style={styles.dateChip}>
                  <Text style={styles.dateText}>{formatDate(date)}</Text>
                  <TouchableOpacity onPress={() => onRemoveDate(date)}>
                    <Ionicons name="close" size={16} color={BikeColors.error} />
                  </TouchableOpacity>
                </View>
              ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: BikeColors.textPrimary,
  },
  linkText: {
    color: BikeColors.primary,
    fontWeight: "600",
  },
  helper: {
    marginTop: 6,
    color: BikeColors.textSecondary,
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
});
