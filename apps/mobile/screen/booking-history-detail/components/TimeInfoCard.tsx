import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import InfoCard from "./InfoCard";
import { RentalDetail } from "../../../types/RentalTypes";
import { formatVietnamDateTime } from "../../../utils/date";

type Props = {
  booking: RentalDetail;
};

const formatDate = (dateString: string) =>
  formatVietnamDateTime(dateString, { includeSeconds: true });

const formatDuration = (duration: number, hasEnded: boolean) => {
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
};

const TimeInfoCard = ({ booking }: Props) => {
  return (
    <InfoCard title="Thời gian" icon="time">
      <View style={styles.timeSection}>
        <View style={styles.timeRow}>
          <View style={styles.timeIcon}>
            <Ionicons name="play-circle" size={20} color="#4CAF50" />
          </View>
          <View style={styles.timeInfo}>
            <Text style={styles.timeLabel}>Bắt đầu</Text>
            <Text style={styles.timeDate}>
              {formatDate(booking.start_time)}
            </Text>
            <Text style={styles.timeValue}>
              {formatDate(booking.start_time)}
            </Text>
          </View>
        </View>

        {booking.end_time && (
          <View style={styles.timeRow}>
            <View style={styles.timeIcon}>
              <Ionicons name="stop-circle" size={20} color="#F44336" />
            </View>
            <View style={styles.timeInfo}>
              <Text style={styles.timeLabel}>Kết thúc</Text>
              <Text style={styles.timeDate}>
                {formatDate(booking.end_time)}
              </Text>
              <Text style={styles.timeValue}>
                {formatDate(booking.end_time)}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.durationContainer}>
          <Ionicons name="hourglass" size={16} color="#666" />
          <Text style={styles.durationText}>
            Thời gian thuê:{" "}
            {formatDuration(booking.duration, Boolean(booking.end_time))}
          </Text>
        </View>
      </View>
    </InfoCard>
  );
};

const styles = StyleSheet.create({
  timeSection: {
    marginTop: 8,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  timeIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  timeInfo: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  timeDate: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0066FF",
  },
  durationContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  durationText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    fontWeight: "500",
  },
});

export default TimeInfoCard;
