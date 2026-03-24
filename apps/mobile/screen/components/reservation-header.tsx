import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import type { Reservation } from "../../types/reservation-types";

import { getReservationStatusLabel, statusColorMap } from "../utils/reservation-detail-utils";

type ReservationHeaderProps = {
  onGoBack: () => void;
};

export function ReservationHeader({
  onGoBack,
}: ReservationHeaderProps) {
  return (
    <View
      style={{
        paddingHorizontal: 20,
        paddingBottom: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <TouchableOpacity
          onPress={onGoBack}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "rgba(255,255,255,0.2)",
            justifyContent: "center",
            alignItems: "center",
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ fontSize: 24, fontWeight: "700", color: "#fff" }}>
          Chi tiết đặt trước
        </Text>
      </View>
    </View>
  );
}

type StatusBadgeProps = {
  status: Reservation["status"];
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <View
      style={[
        {
          paddingHorizontal: 12,
          paddingVertical: 4,
          borderRadius: 12,
          alignSelf: "flex-start",
          maxWidth: "70%",
          backgroundColor: statusColorMap[status] ?? "#0066FF",
        },
      ]}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: "700",
          color: "#fff",
          textTransform: "uppercase",
        }}
      >
        {getReservationStatusLabel(status)}
      </Text>
    </View>
  );
}

type ReservationSummaryProps = {
  status: Reservation["status"];
  bikeId?: string | number;
  reservationId: string;
};

export function ReservationSummary({ status, bikeId, reservationId }: ReservationSummaryProps) {
  const shortReservationId = reservationId.length > 20
    ? `${reservationId.slice(0, 8)}...${reservationId.slice(-6)}`
    : reservationId;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <Ionicons name="bicycle" size={24} color="#0066FF" />
      <View style={{ flex: 1, flexDirection: "column", gap: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#263238" }}>
            Xe #
            {String(bikeId ?? "").slice(-4) || bikeId}
          </Text>
        </View>
        <StatusBadge status={status} />
        <Text style={{ marginTop: 4, fontSize: 13, color: "#607D8B" }} selectable>
          Mã đặt:
          {shortReservationId}
        </Text>
      </View>
    </View>
  );
}
