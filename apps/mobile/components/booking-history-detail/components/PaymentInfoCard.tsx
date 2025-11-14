import React from "react";
import { StyleSheet, Text, View } from "react-native";
import InfoCard from "./InfoCard";
import { RentalDetail } from "../../../types/RentalTypes";

type Props = {
  booking: RentalDetail;
};

const PaymentInfoCard = ({ booking }: Props) => {
  return (
    <InfoCard title="Thanh toán" icon="card">
      <View style={styles.paymentRow}>
        <Text style={styles.paymentLabel}>Tổng tiền:</Text>
        <Text style={styles.paymentAmount}>
          {typeof booking.total_price === "object" &&
          booking.total_price !== null
            ? Number.parseFloat(
                booking.total_price.$numberDecimal
              ).toLocaleString("vi-VN")
            : Number(booking.total_price).toLocaleString("vi-VN")}{" "}
          đ
        </Text>
      </View>
    </InfoCard>
  );
};

const styles = StyleSheet.create({
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 8,
  },
  paymentLabel: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0066FF",
  },
});

export default PaymentInfoCard;
