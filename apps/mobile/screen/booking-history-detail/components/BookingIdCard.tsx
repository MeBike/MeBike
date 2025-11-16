import React from "react";
import { StyleSheet, Text } from "react-native";
import InfoCard from "./InfoCard";
import { RentalDetail } from "../../../types/RentalTypes";

type Props = {
  booking: RentalDetail;
};

const BookingIdCard = ({ booking }: Props) => {
  return (
    <InfoCard title="Mã đặt xe" icon="document-text">
      <Text style={styles.bookingId}>{booking._id}</Text>
      <Text style={styles.bookingIdNote}>
        Lưu mã này để tra cứu hoặc liên hệ hỗ trợ
      </Text>
    </InfoCard>
  );
};

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

export default BookingIdCard;
