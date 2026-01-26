import { BikeColors } from "@constants/BikeColors";
import { formatVietnamDateTime } from "@utils/date";
import React from "react";
import { ActivityIndicator, Text, View } from "react-native";

import type { Bike } from "../../../types/BikeTypes";

import { styles } from "../styles";

type Props = {
  currentBike: Bike;
  stationName: string;
  statusColor: string;
  isFetching: boolean;
};

export function BikeSummaryCard({
  currentBike,
  stationName,
  statusColor,
  isFetching,
}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.bikeTitle}>
        {currentBike.chip_id
          ? `Chip #${currentBike.chip_id}`
          : `Xe #${currentBike._id.slice(-4)}`}
      </Text>
      <View style={styles.bikeMetaRow}>
        <Text
          style={[
            styles.badge,
            { backgroundColor: statusColor, color: "#fff" },
          ]}
        >
          {currentBike.status}
        </Text>
        <Text style={styles.helperText}>{stationName}</Text>
      </View>
      <View style={{ marginTop: 16, gap: 10 }}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Nhà cung cấp:</Text>
          <Text style={styles.infoValue}>
            {currentBike.supplier_name
              ?? (currentBike.supplier_id
                ? `...${currentBike.supplier_id.slice(-6)}`
                : null)
              ?? "Chưa cập nhật"}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ngày tạo:</Text>
          <Text style={styles.infoValue}>
            {formatVietnamDateTime(currentBike.created_at)}
          </Text>
        </View>
      </View>
      {isFetching && (
        <View style={styles.refreshRow}>
          <ActivityIndicator size="small" color={BikeColors.primary} />
          <Text style={styles.helperText}>Đang cập nhật trạng thái...</Text>
        </View>
      )}
    </View>
  );
}
