import React from "react";
import { StyleSheet, Text } from "react-native";
import { formatSupportCode, shortenId } from "@utils/id";

import InfoCard from "../components/InfoCard";

export function RentalBookingIdCard({ rentalId }: { rentalId: string }) {
  return (
    <InfoCard title="Mã thuê xe" icon="document-text">
      <Text style={styles.bookingId}>{formatSupportCode(rentalId)}</Text>
      <Text style={styles.fullId}>{shortenId(rentalId, { head: 8, tail: 6 })}</Text>
      <Text style={styles.bookingIdNote}>
        Lưu mã này để tra cứu hoặc liên hệ hỗ trợ
      </Text>
    </InfoCard>
  );
}

const styles = StyleSheet.create({
  bookingId: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: "#1D4ED8",
    backgroundColor: "#EFF6FF",
    padding: 12,
    borderRadius: 10,
    textAlign: "center",
    marginBottom: 4,
  },
  fullId: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 8,
  },
  bookingIdNote: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    fontStyle: "italic",
  },
});
