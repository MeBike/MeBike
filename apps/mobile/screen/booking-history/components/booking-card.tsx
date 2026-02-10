import { Ionicons } from "@expo/vector-icons";
import { formatVietnamDateTime } from "@utils/date";
import { memo, useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { Rental, RentalStatus } from "@/types/rental-types";

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  bikeInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  bikeDetails: {
    marginLeft: 12,
    flex: 1,
  },
  bikeType: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  location: {
    fontSize: 13,
    color: "#666",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 12,
  },
  cardDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 13,
    color: "#666",
  },
  priceText: {
    fontWeight: "600",
    color: "#0066FF",
    fontSize: 14,
  },
  detailButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  detailButtonText: {
    color: "#0066FF",
    fontSize: 14,
    fontWeight: "600",
    marginRight: 4,
  },
});

type BookingCardProps = {
  booking: Rental;
  onPress: (bookingId: string) => void;
};

const BookingCard = memo(({ booking, onPress }: BookingCardProps) => {
  const priceText = useMemo(() => {
    const total = booking.totalPrice ?? 0;
    return `${total.toLocaleString("vi-VN")} đ`;
  }, [booking.totalPrice]);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.bikeInfo}>
          <Ionicons name="bicycle" size={24} color="#0066FF" />
          <View style={styles.bikeDetails}>
            <Text style={styles.bikeType}>Xe đạp</Text>
            <Text style={styles.location}>
              {`ID: ${booking.startStation}`}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(booking.status) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusText(booking.status)}</Text>
        </View>
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardDetails}>
        <DetailRow
          icon="calendar"
          text={formatVietnamDateTime(booking.startTime)}
        />
        <DetailRow
          icon="time"
          text={formatDuration(booking.duration, Boolean(booking.endTime))}
        />
        <DetailRow icon="pricetag" text={priceText} isPrice />
      </View>

      <TouchableOpacity
        style={styles.detailButton}
        onPress={() => onPress(booking.id)}
      >
        <Text style={styles.detailButtonText}>Xem chi tiết</Text>
        <Ionicons name="chevron-forward" size={16} color="#0066FF" />
      </TouchableOpacity>
    </View>
  );
});

type DetailRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  isPrice?: boolean;
};

function DetailRow({ icon, text, isPrice = false }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <Ionicons
        name={icon}
        size={16}
        color={isPrice ? "#0066FF" : "#666"}
      />
      <Text style={[styles.detailText, isPrice && styles.priceText]}>
        {text}
      </Text>
    </View>
  );
}

function getStatusColor(status: RentalStatus) {
  switch (status) {
    case "COMPLETED":
      return "#4CAF50";
    case "RENTED":
      return "#FF9800";
    case "CANCELLED":
      return "#F44336";
    case "RESERVED":
      return "#7C3AED";
    default:
      return "#999";
  }
}

function getStatusText(status: RentalStatus) {
  switch (status) {
    case "COMPLETED":
      return "Hoàn thành";
    case "RENTED":
      return "Đang thuê";
    case "CANCELLED":
      return "Đã hủy";
    case "RESERVED":
      return "Đã đặt trước";
    default:
      return status;
  }
}

function formatDuration(duration: number, hasEnded: boolean) {
  if (!duration || duration <= 0) {
    return hasEnded ? "0 phút" : "Chưa kết thúc";
  }
  const totalMinutes = Math.floor(duration);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) {
    return `${hours} giờ ${minutes} phút`;
  }
  if (hours > 0) {
    return `${hours} giờ`;
  }
  return `${minutes} phút`;
}

export default BookingCard;
