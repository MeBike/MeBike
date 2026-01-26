import { formatVietnamDateTime } from "@utils/date";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import type { Reservation } from "../../../types/reservation-types";

import { styles } from "../styles";

type Props = {
  reservation: Reservation;
  onViewDetail: () => void;
};

export function ReservationBanner({ reservation, onViewDetail }: Props) {
  return (
    <View style={[styles.card, styles.reservationCard]}>
      <Text style={styles.sectionTitle}>Bạn đang giữ xe này</Text>
      <Text style={styles.helperText}>
        Bắt đầu lúc
        {" "}
        {formatVietnamDateTime(reservation.start_time)}
      </Text>
      <TouchableOpacity
        style={[styles.secondaryButton, { marginTop: 12 }]}
        onPress={onViewDetail}
      >
        <Text style={styles.secondaryButtonText}>Xem chi tiết giữ xe</Text>
      </TouchableOpacity>
    </View>
  );
}
