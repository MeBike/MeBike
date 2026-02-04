import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { styles } from "../styles";

export function ResultCard({
  title,
  rentalIdLabel,
  statusText,
  statusColor,
  bikeIdLabel,
  startTimeLabel,
  durationLabel,
  stationLabel,
  onPress,
}: {
  title: string;
  rentalIdLabel: string;
  statusText: string;
  statusColor: string;
  bikeIdLabel: string;
  startTimeLabel: string;
  durationLabel: string;
  stationLabel?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.resultCard}
      activeOpacity={0.9}
      onPress={onPress}
    >
      <View style={styles.resultHeader}>
        <View style={styles.resultTitleWrapper}>
          <Text
            style={styles.resultTitle}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
          <Text style={styles.resultSubTitle}>{rentalIdLabel}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusBadgeText}>{statusText}</Text>
        </View>
      </View>

      <View style={styles.resultBody}>
        <View style={styles.resultRow}>
          <Ionicons name="bicycle" size={18} color="#2563EB" />
          <Text style={styles.resultRowText}>{bikeIdLabel}</Text>
        </View>
        <View style={styles.resultRow}>
          <Ionicons name="time" size={16} color="#64748B" />
          <Text style={styles.resultRowText}>{startTimeLabel}</Text>
        </View>
        <View style={styles.resultRow}>
          <Ionicons name="hourglass" size={16} color="#64748B" />
          <Text style={styles.resultRowText}>{durationLabel}</Text>
        </View>
        {stationLabel && (
          <View style={styles.resultRow}>
            <Ionicons name="navigate" size={16} color="#64748B" />
            <Text style={styles.resultRowText} numberOfLines={1} ellipsizeMode="tail">
              {stationLabel}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.footerHint}>Chạm để quản lý phiên thuê</Text>
        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );
}
