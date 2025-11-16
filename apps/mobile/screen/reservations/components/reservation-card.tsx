import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { Reservation } from "../../../types/reservation-types";

import { formatCurrency, formatDateTime, statusColorMap } from "../../../utils/reservation-screen-utils";

type ReservationCardProps = {
  reservation: Reservation;
  stationName?: string;
  stationId: string;
  onPress: () => void;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "column",
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitleContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#263238",
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#607D8B",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    maxWidth: "70%",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
    textTransform: "uppercase",
  },
  cardBody: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ECEFF1",
    paddingTop: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  detailText: {
    fontSize: 14,
    color: "#455A64",
  },
  detailHighlight: {
    fontWeight: "600",
    color: "#0066FF",
  },
  cardFooter: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
  },
  footerText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0066FF",
  },
});

export function ReservationCard({
  reservation,
  stationName,
  stationId,
  onPress,
}: ReservationCardProps) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <View style={styles.cardTitleContent}>
            <Ionicons name="bicycle" size={22} color="#0066FF" />
            <Text style={styles.cardTitle}>
              Xe #
              {String(reservation.bike_id ?? "").slice(-4) || reservation.bike_id}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColorMap[reservation.status] ?? "#0066FF" },
            ]}
          >
            <Text style={styles.statusText}>{reservation.status}</Text>
          </View>
        </View>
        <Text style={styles.cardSubtitle}>
          Bắt đầu:
          {" "}
          {formatDateTime(reservation.start_time)}
        </Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.detailRow}>
          <Ionicons name="navigate" size={18} color="#666" />
          <Text style={styles.detailText}>
            Trạm:
            {" "}
            {stationName ?? reservation.station?.name ?? `Mã ${String(stationId ?? "").slice(-6)}`}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time" size={18} color="#666" />
          <Text style={styles.detailText}>
            Giữ chỗ đến:
            {" "}
            {formatDateTime(reservation.end_time)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="wallet" size={18} color="#0066FF" />
          <Text style={[styles.detailText, styles.detailHighlight]}>
            Đã thanh toán:
            {" "}
            {formatCurrency(reservation.prepaid)}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.footerText}>Xem chi tiết</Text>
        <Ionicons name="chevron-forward" size={18} color="#0066FF" />
      </View>
    </TouchableOpacity>
  );
}
