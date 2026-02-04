import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { Rental } from "@/types/rental-types";

type Props = {
  rental: Rental;
};
const styles = StyleSheet.create({
  supportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#0066FF",
  },
  supportButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0066FF",
    marginLeft: 8,
  },
  endRentalButton: {
    borderRadius: 12,
    marginBottom: 24,
    overflow: "hidden",
  },
  endRentalButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  qrButtonTextWrapper: {
    marginLeft: 12,
    flex: 1,
  },
  qrButtonTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  qrButtonSubtitle: {
    fontSize: 12,
    color: "#DFF3FF",
    marginTop: 2,
  },
  sosButton: {
    borderRadius: 12,
    marginBottom: 24,
    overflow: "hidden",
  },
  sosButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  sosButtonTextWrapper: {
    marginLeft: 12,
    flex: 1,
  },
  sosButtonTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  sosButtonSubtitle: {
    fontSize: 12,
    color: "#FFE5E5",
    marginTop: 2,
  },
});

export function RentalActionButtons({ rental }: Props) {
  const navigation = useNavigation();
  return (
    <>
      {rental.status === "RENTED" && (
        <>
          <TouchableOpacity
            style={styles.endRentalButton}
            onPress={() =>
              (navigation as any).navigate("RentalQr", {
                bookingId: rental.id,
              })}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["#0066FF", "#00B4D8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.endRentalButtonContent}
            >
              <Ionicons name="qr-code" size={26} color="#fff" />
              <View style={styles.qrButtonTextWrapper}>
                <Text style={styles.qrButtonTitle}>Trình mã QR cho nhân viên</Text>
                <Text style={styles.qrButtonSubtitle}>
                  Nhân viên sẽ quét để kết thúc phiên thuê giúp bạn
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#DFF3FF" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sosButton}
            onPress={() => {
              (navigation as any).navigate("CreateSOSRequest", { rentalId: rental.id });
            }}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["#FF3B30", "#FF6B6B"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.sosButtonContent}
            >
              <Ionicons name="alert-circle" size={26} color="#fff" />
              <View style={styles.sosButtonTextWrapper}>
                <Text style={styles.sosButtonTitle}>Yêu cầu cứu hộ khẩn cấp</Text>
                <Text style={styles.sosButtonSubtitle}>
                  Gọi đội cứu hộ đến vị trí của bạn
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#FFE5E5" />
            </LinearGradient>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        style={styles.supportButton}
        onPress={() => {
          (navigation as any).navigate("Report", {
            bike_id: rental.bikeId ?? undefined,
            station_id: rental.startStation,
            rental_id: rental.id,
          });
        }}
      >
        <Ionicons name="warning" size={20} color="#0066FF" />
        <Text style={styles.supportButtonText}>Báo cáo sự cố</Text>
      </TouchableOpacity>
    </>
  );
}
