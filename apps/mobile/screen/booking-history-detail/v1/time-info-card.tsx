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
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatTime(dateString: string) {
  const full = formatVietnamDateTime(dateString, { includeSeconds: true });
  const parts = full.split(" ");
  return parts.length > 1 ? parts.slice(1).join(" ") : full;
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

function TimelineItem({
  isFirst,
  isLast,
  label,
  date,
  time,
  icon,
  iconColor,
}: {
  isFirst: boolean;
  isLast: boolean;
  label: string;
  date: string;
  time: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
}) {
  return (
    <View style={[styles.timelineItem, isLast && styles.timelineItemLast]}>
      <View style={styles.timelineAxis}>
        {!isFirst ? <View style={styles.timelineLineTop} /> : <View style={styles.timelineLinePlaceholder} />}
        <View style={[styles.timelineNode, { borderColor: iconColor }]}>
          <Ionicons name={icon} size={14} color={iconColor} />
        </View>
        {!isLast ? <View style={styles.timelineLineBottom} /> : <View style={styles.timelineLinePlaceholder} />}
      </View>

      <View style={styles.timelineContent}>
        <Text style={styles.timelineLabel}>{label}</Text>
        <Text style={styles.timelineDate}>{date}</Text>
        <Text style={styles.timelineTime}>{time}</Text>
      </View>
    </View>
  );
}

export function RentalTimeInfoCard({ rental }: { rental: RentalTimeInfo }) {
  return (
    <InfoCard title="Hành trình" icon="git-network-outline">
      <View style={styles.timelineWrap}>
        <TimelineItem
          isFirst
          isLast={!rental.endTime}
          label="Bắt đầu"
          date={formatDate(rental.startTime)}
          time={formatTime(rental.startTime)}
          icon="play"
          iconColor="#16A34A"
        />

        {rental.endTime
          ? (
              <TimelineItem
                isFirst={false}
                isLast
                label="Kết thúc"
                date={formatDate(rental.endTime)}
                time={formatTime(rental.endTime)}
                icon="stop"
                iconColor="#DC2626"
              />
            )
          : null}
      </View>

      <View style={styles.durationContainer}>
        <Ionicons name="hourglass-outline" size={16} color="#64748B" />
        <Text style={styles.durationText}>
          Tổng thời gian:
          {" "}
          {formatDuration(rental.duration, Boolean(rental.endTime))}
        </Text>
      </View>
    </InfoCard>
  );
}

const styles = StyleSheet.create({
  timelineWrap: {
    marginTop: 2,
    marginBottom: 8,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: 76,
  },
  timelineItemLast: {
    minHeight: 64,
  },
  timelineAxis: {
    width: 28,
    alignItems: "center",
  },
  timelineLineTop: {
    width: 1,
    flex: 1,
    backgroundColor: "#DDE3EC",
  },
  timelineLineBottom: {
    width: 1,
    flex: 1,
    backgroundColor: "#DDE3EC",
  },
  timelineLinePlaceholder: {
    width: 1,
    flex: 1,
    backgroundColor: "transparent",
  },
  timelineNode: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 10,
  },
  timelineLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "700",
    marginBottom: 1,
  },
  timelineTime: {
    fontSize: 14,
    color: "#2563EB",
    fontWeight: "600",
  },
  durationContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E6EAF2",
  },
  durationText: {
    fontSize: 14,
    color: "#475569",
    marginLeft: 8,
    fontWeight: "600",
  },
});
