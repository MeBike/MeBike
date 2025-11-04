import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { Reservation } from "../../types/reservation-types";

import { formatCurrency, formatDateTime } from "../utils/reservation-detail-utils";

type InfoRowProps = {
  icon: string;
  label: string;
  value: React.ReactNode;
  secondaryValue?: React.ReactNode;
  marginBottom?: number;
};

export function InfoRow({ icon, label, value, secondaryValue, marginBottom }: InfoRowProps) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: marginBottom ?? 18 }}>
      <Ionicons name={icon as any} size={20} color="#607D8B" />
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text
          style={{
            fontSize: 13,
            color: "#90A4AE",
            marginBottom: 4,
            textTransform: "uppercase",
            letterSpacing: 0.4,
          }}
        >
          {label}
        </Text>
        <Text style={{ fontSize: 15, color: "#263238", fontWeight: "600" }}>{value}</Text>
        {secondaryValue
          ? (
              <Text style={{ marginTop: 4, fontSize: 13, color: "#607D8B" }}>
                {secondaryValue}
              </Text>
            )
          : null}
      </View>
    </View>
  );
}

type ReservationInfoProps = {
  reservation: Reservation;
  stationName?: string;
  stationAddress?: string;
};

export function ReservationInfo({
  reservation,
  stationName,
  stationAddress,
}: ReservationInfoProps) {
  return (
    <View style={{ marginVertical: 20 }}>
      <View
        style={{
          marginBottom: 20,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: "#90A4AE",
        }}
      />

      <InfoRow
        icon="time"
        label="Thời gian giữ chỗ"
        value={formatDateTime(reservation.start_time)}
        secondaryValue={(
          <>
            Hiệu lực đến
            {" "}
            {formatDateTime(reservation.end_time)}
          </>
        )}
      />

      <InfoRow
        icon="navigate"
        label="Trạm lấy xe"
        value={stationName ?? "Không xác định"}
        secondaryValue={stationAddress}
      />

      <InfoRow
        icon="wallet"
        label="Số tiền đã thanh toán"
        value={formatCurrency(reservation.prepaid)}
      />

      <InfoRow
        icon="document-text"
        label="Tạo lúc"
        value={formatDateTime(reservation.created_at)}
        marginBottom={0}
        secondaryValue={(
          <>
            Cập nhật gần nhất
            {" "}
            {formatDateTime(reservation.updated_at)}
          </>
        )}
      />
    </View>
  );
}
