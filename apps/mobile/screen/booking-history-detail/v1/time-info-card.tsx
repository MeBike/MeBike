import { Ionicons } from "@expo/vector-icons";
import { formatVietnamDateTime } from "@utils/date";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import InfoCard from "../components/InfoCard";

type RentalTimeInfo = {
  startTime: string;
  endTime?: string;
  duration: number;
};

function formatDate(dateString: string) {
  return formatVietnamDateTime(dateString, { includeSeconds: true });
}

function formatDuration(durationMinutes: number, hasEnded: boolean) {
  if (!durationMinutes || durationMinutes <= 0) {
    return hasEnded ? "0 phút" : "Chưa kết thúc";
  }
  const totalMinutes = Math.floor(durationMinutes);
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

export function RentalTimeInfoCard({ rental }: { rental: RentalTimeInfo }) {
  return (
    <InfoCard title="Thời gian" icon="time">
      <View style={styles.timeSection}>
        <View style={styles.timeRow}>
          <View style={styles.timeIcon}>
            <Ionicons name="play-circle" size={20} color="#4CAF50" />
          </View>
          <View style={styles.timeInfo}>
            <Text style={styles.timeLabel}>Bắt đầu</Text>
            <Text style={styles.timeDate}>{formatDate(rental.startTime)}</Text>
            <Text style={styles.timeValue}>{formatDate(rental.startTime)}</Text>
          </View>
        </View>

        {rental.endTime && (
          <View style={styles.timeRow}>
            <View style={styles.timeIcon}>
              <Ionicons name="stop-circle" size={20} color="#F44336" />
            </View>
            <View style={styles.timeInfo}>
              <Text style={styles.timeLabel}>Kết thúc</Text>
              <Text style={styles.timeDate}>{formatDate(rental.endTime)}</Text>
              <Text style={styles.timeValue}>{formatDate(rental.endTime)}</Text>
            </View>
          </View>
        )}

        <View style={styles.durationContainer}>
          <Ionicons name="hourglass" size={16} color="#666" />
          <Text style={styles.durationText}>
            Thời gian thuê:
            {" "}
            {formatDuration(rental.duration, Boolean(rental.endTime))}
          </Text>
        </View>
      </View>
    </InfoCard>
  );
}

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
