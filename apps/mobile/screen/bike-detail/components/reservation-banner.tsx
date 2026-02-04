import { formatVietnamDateTime } from "@utils/date";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import type { BikeDetailNavigationProp } from "@/types/navigation";
import type { Reservation } from "@/types/reservation-types";

import { styles } from "../styles";

export function ReservationBanner({
  reservation,
  navigation,
}: {
  reservation: Reservation;
  navigation: BikeDetailNavigationProp;
}) {
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
        onPress={() =>
          navigation.navigate("ReservationDetail", {
            reservationId: reservation._id,
            reservation,
          })}
      >
        <Text style={styles.secondaryButtonText}>Xem chi tiết giữ xe</Text>
      </TouchableOpacity>
    </View>
  );
}
