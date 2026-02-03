import { Ionicons } from "@expo/vector-icons";
import { formatVietnamDateTime } from "@utils/date";
import { parseDecimal } from "@utils/money";
import { memo, useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { RentingHistory } from "../../../types/RentalTypes";

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
  booking: RentingHistory;
  onPress: (bookingId: string) => void;
};

const BookingCard = memo(({ booking, onPress }: BookingCardProps) => {
  const priceText = useMemo(() => {
    return `${parseDecimal(booking.total_price).toLocaleString("vi-VN")} đ`;
  }, [booking.total_price]);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.bikeInfo}>
          <Ionicons name="bicycle" size={24} color="#0066FF" />
          <View style={styles.bikeDetails}>
            <Text style={styles.bikeType}>Xe đạp</Text>
            <Text style={styles.location}>
              {`ID: ${booking.start_station}`}
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
          text={formatVietnamDateTime(booking.start_time)}
        />
        <DetailRow
          icon="time"
          text={formatDuration(booking.duration, Boolean(booking.end_time))}
        />
        <DetailRow icon="pricetag" text={priceText} isPrice />
      </View>

      <TouchableOpacity
        style={styles.detailButton}
        onPress={() => onPress(booking._id)}
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

function getStatusColor(status: string) {
  switch (status) {
    case "HOÀN THÀNH":
      return "#4CAF50";
    case "ĐANG THUÊ":
      return "#FF9800";
    case "ĐÃ HỦY":
      return "#F44336";
    default:
      return "#999";
  }
}

function getStatusText(status: string) {
  switch (status) {
    case "HOÀN THÀNH":
      return "Hoàn thành";
    case "ĐANG THUÊ":
      return "Đang thuê";
    case "ĐÃ HỦY":
      return "Đã hủy";
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
