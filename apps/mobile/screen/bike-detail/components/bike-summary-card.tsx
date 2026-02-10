import React from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { BikeColors } from "@constants/BikeColors";
import { formatVietnamDateTime } from "@utils/date";

import type { Bike } from "@/types/BikeTypes";

import { styles } from "../styles";

function shortId(value: string, options?: { head?: number; tail?: number }) {
  const head = options?.head ?? 6;
  const tail = options?.tail ?? 4;
  if (!value) return "";
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

export function BikeSummaryCard({
  bike,
  stationName,
  statusColor,
  isRefreshing,
}: {
  bike: Bike;
  stationName: string;
  statusColor: string;
  isRefreshing: boolean;
}) {
  return (
    <View style={styles.card}>
      <Text
        style={[styles.bikeTitle, styles.bikeTitleMono]}
        numberOfLines={1}
      >
        {`Xe #${shortId(bike._id, { head: 8, tail: 4 })}`}
      </Text>
      <View style={styles.bikeMetaRow}>
        <Text
          style={[
            styles.badge,
            { backgroundColor: statusColor, color: "#fff" },
          ]}
        >
          {bike.status}
        </Text>
        <Text
          style={[styles.helperText, { flex: 1, textAlign: "right", marginLeft: 12 }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {stationName}
        </Text>
      </View>
      <View style={{ marginTop: 16, gap: 10 }}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Nhà cung cấp</Text>
          <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="middle">
            {bike.supplier_id ? shortId(bike.supplier_id) : "Chưa cập nhật"}
          </Text>
        </View>
        {Boolean(bike.created_at) && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ngày tạo</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {formatVietnamDateTime(bike.created_at)}
            </Text>
          </View>
        )}
      </View>

      {isRefreshing && (
        <View style={styles.refreshRow}>
          <ActivityIndicator size="small" color={BikeColors.primary} />
          <Text style={styles.helperText}>Đang cập nhật trạng thái...</Text>
        </View>
      )}
    </View>
  );
}
