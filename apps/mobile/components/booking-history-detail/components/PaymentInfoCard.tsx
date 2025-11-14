import { parseDecimal } from "@utils/subscription";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import InfoCard from "./InfoCard";
import { RentalDetail } from "../../../types/RentalTypes";

type Props = {
  booking: RentalDetail;
};

const PaymentInfoCard = ({ booking }: Props) => {
  const totalAmount = parseDecimal(booking.total_price);
  const isSubscriptionRental = Boolean(booking.subscription_id);
  const paymentMethodLabel = isSubscriptionRental ? "Gói tháng" : "Ví MeBike";
  const amountLabel = isSubscriptionRental ? "Chi phí thêm:" : "Tổng tiền:";
  const showSubscriptionNote = isSubscriptionRental && totalAmount === 0;

  return (
    <InfoCard title="Thanh toán" icon="card">
      <View style={[styles.paymentRow, styles.methodRow]}>
        <Text style={styles.paymentLabel}>Phương thức:</Text>
        <Text
          style={[
            styles.paymentMethod,
            isSubscriptionRental
              ? styles.subscriptionMethod
              : styles.walletMethod,
          ]}
        >
          {paymentMethodLabel}
        </Text>
      </View>
      <View style={styles.paymentRow}>
        <Text style={styles.paymentLabel}>{amountLabel}</Text>
        <Text style={styles.paymentAmount}>
          {totalAmount.toLocaleString("vi-VN")} đ
        </Text>
      </View>
      {showSubscriptionNote && (
        <Text style={styles.subscriptionNote}>
          Chi phí đã bao gồm trong gói tháng.
        </Text>
      )}
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
    marginTop: 8,
  },
  methodRow: {
    marginTop: 0,
    marginBottom: 8,
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
  paymentMethod: {
    fontSize: 16,
    fontWeight: "600",
  },
  walletMethod: {
    color: "#0066FF",
  },
  subscriptionMethod: {
    color: "#0C8A2A",
  },
  subscriptionNote: {
    marginTop: 8,
    fontSize: 14,
    color: "#4B5563",
  },
});

export default PaymentInfoCard;
