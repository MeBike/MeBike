import { Ionicons } from "@expo/vector-icons";
import { formatVietnamDateTime } from "@utils/date";
import { formatSupportCode } from "@utils/id";
import { memo, useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { Rental, RentalStatus } from "@/types/rental-types";

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E3E8F2",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 10,
  },
  leftWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    gap: 10,
  },
  bikeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EDF4FF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  bikeName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 2,
  },
  bookingCode: {
    fontSize: 12,
    color: "#6B7280",
  },
  rightWrap: {
    alignItems: "flex-end",
    gap: 8,
  },
  priceText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  routeText: {
    flex: 1,
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#EEF2F7",
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  metaText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
});

type BookingCardProps = {
  booking: Rental;
  stationNameById: Map<string, string>;
  onPress: (bookingId: string) => void;
};

const BookingCard = memo(({ booking, stationNameById, onPress }: BookingCardProps) => {
  const priceText = useMemo(() => {
    const total = booking.totalPrice ?? 0;
    return `${total.toLocaleString("vi-VN")} đ`;
  }, [booking.totalPrice]);

  const routeText = useMemo(() => {
    const startLabel = stationNameById.get(booking.startStation)
      ?? formatSupportCode(booking.startStation);
    const endLabel = booking.endStation
      ? (stationNameById.get(booking.endStation) ?? formatSupportCode(booking.endStation))
      : "Đang thuê";
    return `${startLabel} → ${endLabel}`;
  }, [booking.endStation, booking.startStation, stationNameById]);

  const status = getStatusStyle(booking.status);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.card}
      onPress={() => onPress(booking.id)}
    >
      <View style={styles.topRow}>
        <View style={styles.leftWrap}>
          <View style={styles.bikeIconWrap}>
            <Ionicons name="bicycle" size={20} color="#2563EB" />
          </View>
          <View>
            <Text style={styles.bikeName}>Xe đạp</Text>
            <Text style={styles.bookingCode}>{formatSupportCode(booking.id)}</Text>
          </View>
        </View>

        <View style={styles.rightWrap}>
          <Text style={styles.priceText}>{priceText}</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.backgroundColor }]}>
            <Text style={[styles.statusText, { color: status.textColor }]}>{status.text}</Text>
          </View>
        </View>
      </View>

      <View style={styles.routeRow}>
        <Ionicons name="git-network-outline" size={16} color="#64748B" />
        <Text style={styles.routeText} numberOfLines={1}>{routeText}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
          <Text style={styles.metaText}>{formatVietnamDateTime(booking.startTime)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={16} color="#9CA3AF" />
          <Text style={styles.metaText}>{formatDuration(booking.duration, Boolean(booking.endTime))}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

function getStatusStyle(status: RentalStatus) {
  switch (status) {
    case "COMPLETED":
      return {
        text: "Hoàn thành",
        backgroundColor: "#E8F5E9",
        textColor: "#2E7D32",
      };
    case "RENTED":
      return {
        text: "Đang thuê",
        backgroundColor: "#FFF4E5",
        textColor: "#B45309",
      };
    case "CANCELLED":
      return {
        text: "Đã hủy",
        backgroundColor: "#FDECEC",
        textColor: "#B91C1C",
      };
    case "RESERVED":
      return {
        text: "Đã đặt",
        backgroundColor: "#EEF2FF",
        textColor: "#3730A3",
      };
    default:
      return {
        text: status,
        backgroundColor: "#F3F4F6",
        textColor: "#4B5563",
      };
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
