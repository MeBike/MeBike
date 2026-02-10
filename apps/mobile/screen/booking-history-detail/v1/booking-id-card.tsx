import React from "react";
import { StyleSheet, Text } from "react-native";

import InfoCard from "../components/InfoCard";

export function RentalBookingIdCard({ rentalId }: { rentalId: string }) {
  return (
    <InfoCard title="Mã thuê xe" icon="document-text">
      <Text style={styles.bookingId}>{rentalId}</Text>
      <Text style={styles.bookingIdNote}>
        Lưu mã này để tra cứu hoặc liên hệ hỗ trợ
      </Text>
    </InfoCard>
  );
}

const styles = StyleSheet.create({
  bookingId: {
    fontSize: 14,
    fontFamily: "monospace",
    color: "#333",
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    textAlign: "center",
    marginBottom: 8,
  },
  bookingIdNote: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
});
