import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BikeColors } from "@constants/BikeColors";
import { useFixedSlotTemplateDetailQuery } from "@hooks/query/FixedSlots/useFixedSlotTemplateDetailQuery";

import { DateChips } from "./fixed-slot-detail/components/DateChips";
import { InfoHighlights } from "./fixed-slot-detail/components/InfoHighlights";
import { StationSummary } from "./fixed-slot-detail/components/StationSummary";

import type {
  FixedSlotDetailNavigationProp,
  FixedSlotDetailRouteProp,
} from "@/types/navigation";

export default function FixedSlotDetailScreen() {
  const navigation = useNavigation<FixedSlotDetailNavigationProp>();
  const route = useRoute<FixedSlotDetailRouteProp>();
  const { templateId } = route.params;
  const insets = useSafeAreaInsets();

  const { data, isLoading } = useFixedSlotTemplateDetailQuery(templateId, true);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0066FF", "#00B4D8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <Ionicons
          name="chevron-back"
          size={24}
          color="#fff"
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerTitle}>Chi tiết khung giờ</Text>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {isLoading || !data
          ? (
              <View style={styles.loader}>
                <ActivityIndicator color={BikeColors.primary} size="large" />
              </View>
            )
          : (
              <View style={styles.card}>
                <StationSummary
                  name={data.station_name}
                  stationId={data.station_id}
                  status={data.status}
                />

                <InfoHighlights slotStart={data.slot_start} totalDates={data.selected_dates.length} />

                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionLabel}>Danh sách ngày</Text>
                  <Text style={styles.sectionMeta}>{data.selected_dates.length} ngày</Text>
                </View>
                <DateChips dates={data.selected_dates} />

                {data.status === "ĐANG HOẠT ĐỘNG" && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() =>
                      navigation.navigate("FixedSlotEditor", {
                        templateId,
                        stationId: data.station_id,
                        stationName: data.station_name,
                      })}
                  >
                    <Text style={styles.editButtonText}>Chỉnh sửa khung giờ</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BikeColors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  content: {
    flex: 1,
    backgroundColor: "#F3F5FB",
  },
  contentContainer: {
    padding: 20,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    borderRadius: 24,
    backgroundColor: "#fff",
    padding: 22,
    gap: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: BikeColors.textSecondary,
  },
  sectionMeta: {
    fontSize: 12,
    color: BikeColors.textSecondary,
  },
  editButton: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: BikeColors.primary,
    alignItems: "center",
  },
  editButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
