import React from "react";
import { StyleSheet, Text, View } from "react-native";

type RentalPaymentInfo = {
  totalPrice?: number;
  subscriptionId?: string;
};

import InfoCard from "../components/InfoCard";

export function RentalPaymentInfoCard({ rental }: { rental: RentalPaymentInfo }) {
  const totalAmount = rental.totalPrice ?? 0;
  const isSubscriptionRental = Boolean(rental.subscriptionId);
  const paymentMethodLabel = isSubscriptionRental ? "Gói tháng" : "Ví MeBike";
  const shouldShowAmount = !isSubscriptionRental || totalAmount > 0;
  const showSubscriptionNote = isSubscriptionRental && totalAmount === 0;

  return (
    <InfoCard title="Thanh toán" icon="card">
      <View style={[styles.paymentRow, styles.methodRow]}>
        <Text style={styles.paymentLabel}>Phương thức:</Text>
        <Text
          style={[
            styles.paymentMethod,
            isSubscriptionRental ? styles.subscriptionMethod : styles.walletMethod,
          ]}
        >
          {paymentMethodLabel}
        </Text>
      </View>
      {shouldShowAmount && (
        <View style={styles.paymentRow}>
          <Text style={styles.paymentLabel}>Tổng tiền:</Text>
          <Text style={styles.paymentAmount}>
            {totalAmount.toLocaleString("vi-VN")}
            {" "}
            đ
          </Text>
        </View>
      )}
      {showSubscriptionNote && (
        <Text style={styles.subscriptionNote}>
          Chi phí đã bao gồm trong gói tháng.
        </Text>
      )}
    </InfoCard>
  );
}

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
