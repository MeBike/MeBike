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
        colors={[BikeColors.primary, BikeColors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons
            name="chevron-back"
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  content: {
    flex: 1,
    backgroundColor: BikeColors.surfaceVariant,
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
    borderRadius: 20,
    backgroundColor: BikeColors.surface,
    padding: 20,
    gap: 16,
    shadowColor: BikeColors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
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
