import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { BikeColors } from "@constants";

type Props = {
  stationId: string;
  stationName?: string;
  resolvedStationName?: string;
  canEdit: boolean;
  isEditMode: boolean;
  onChangeStationId: (value: string) => void;
};

export function StationSection({
  stationId,
  stationName,
  resolvedStationName,
  canEdit,
  isEditMode,
  onChangeStationId,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Trạm áp dụng</Text>
      {canEdit ? (
        <>
          <TextInput
            style={styles.input}
            value={stationId}
            onChangeText={onChangeStationId}
            placeholder="Nhập ID trạm"
          />
          {stationName && (
            <Text style={styles.helper}>
              Gợi ý: {stationName}
              {stationId ? ` (ID: ${stationId})` : ""}
            </Text>
          )}
        </>
      ) : (
        <View style={styles.summary}>
          <View style={styles.summaryHeader}>
            <Text
              style={styles.summaryTitle}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {resolvedStationName ?? "Trạm chưa xác định"}
            </Text>
            {stationId ? (
              <Text
                style={styles.summaryBadge}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                ID: {stationId}
              </Text>
            ) : null}
          </View>
          {isEditMode && (
            <Text style={styles.helper}>
              Chỉ chỉnh sửa trên khung giờ của trạm này.
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  helper: {
    marginTop: 6,
    color: BikeColors.textSecondary,
  },
  summary: {
    backgroundColor: BikeColors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    shadowColor: BikeColors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderColor: BikeColors.divider,
    gap: 6,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: BikeColors.textPrimary,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },
  summaryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.05)",
    color: BikeColors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
});
