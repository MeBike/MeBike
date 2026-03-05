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
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EDEFF3",
  },
  methodRow: {
    marginTop: 0,
  },
  paymentLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  paymentAmount: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0066FF",
  },
  paymentMethod: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "right",
    marginLeft: 16,
  },
  walletMethod: {
    color: "#0066FF",
  },
  subscriptionMethod: {
    color: "#0C8A2A",
  },
  subscriptionNote: {
    marginTop: 10,
    fontSize: 12,
    color: "#64748B",
  },
});
