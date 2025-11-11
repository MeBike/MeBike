import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BikeColors } from "@constants/BikeColors";
import { useFixedSlotTemplateDetailQuery } from "@hooks/query/FixedSlots/useFixedSlotTemplateDetailQuery";

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

      <View style={styles.content}>
        {isLoading || !data
          ? (
              <View style={styles.loader}>
                <ActivityIndicator color={BikeColors.primary} size="large" />
              </View>
            )
          : (
              <View style={styles.card}>
                <Text style={styles.label}>Trạm</Text>
                <Text style={styles.value}>{data.station_name ?? "Không xác định"}</Text>

                <Text style={styles.label}>Giờ bắt đầu</Text>
                <Text style={styles.value}>{data.slot_start}</Text>

                <Text style={styles.label}>Trạng thái</Text>
                <Text style={styles.value}>{data.status}</Text>

                <Text style={styles.label}>Ngày đã chọn</Text>
                {data.selected_dates.map((date) => (
                  <Text key={date} style={styles.dateItem}>
                    {date}
                  </Text>
                ))}
              </View>
            )}
      </View>
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
    gap: 8,
  },
  label: {
    fontSize: 13,
    textTransform: "uppercase",
    color: BikeColors.textSecondary,
    marginTop: 12,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
    color: BikeColors.textPrimary,
  },
  dateItem: {
    fontSize: 14,
    color: BikeColors.textPrimary,
  },
});
