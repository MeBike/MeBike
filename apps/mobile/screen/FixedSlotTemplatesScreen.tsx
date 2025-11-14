import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FixedSlotTemplateCard } from "@components/reservation-flow/FixedSlotTemplateCard";
import { BikeColors } from "@constants/BikeColors";
import { useFixedSlotTemplatesQuery } from "@hooks/query/FixedSlots/useFixedSlotTemplatesQuery";
import { useCancelFixedSlotTemplateMutation } from "@hooks/mutations/FixedSlots/useCancelFixedSlotTemplateMutation";
import { usePauseFixedSlotTemplateMutation } from "@hooks/mutations/FixedSlots/usePauseFixedSlotTemplateMutation";
import { useResumeFixedSlotTemplateMutation } from "@hooks/mutations/FixedSlots/useResumeFixedSlotTemplateMutation";
import { useAuth } from "@providers/auth-providers";

import type {
  FixedSlotTemplatesNavigationProp,
  FixedSlotTemplatesRouteProp,
} from "@/types/navigation";
import type { FixedSlotStatus } from "@/types/fixed-slot-types";

const STATUS_FILTERS: Array<{ label: string; value?: FixedSlotStatus }> = [
  { label: "Tất cả" },
  { label: "ĐANG HOẠT ĐỘNG", value: "ĐANG HOẠT ĐỘNG" },
  { label: "TẠM DỪNG", value: "TẠM DỪNG" },
  { label: "ĐÃ HUỶ", value: "ĐÃ HUỶ" },
];

export default function FixedSlotTemplatesScreen() {
  const navigation = useNavigation<FixedSlotTemplatesNavigationProp>();
  const route = useRoute<FixedSlotTemplatesRouteProp>();
  const { stationId, stationName } = route.params ?? {};
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const hasToken = Boolean(user?._id);

  const [statusFilter, setStatusFilter] = useState<FixedSlotStatus | undefined>();

  const { data, isFetching, refetch, isLoading } = useFixedSlotTemplatesQuery(
    { page: 1, limit: 20, station_id: stationId, status: statusFilter },
    hasToken,
  );

  const pauseMutation = usePauseFixedSlotTemplateMutation();
  const resumeMutation = useResumeFixedSlotTemplateMutation();
  const cancelMutation = useCancelFixedSlotTemplateMutation();

  const handleInvalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["fixed-slots"] });
  }, [queryClient]);

  const handlePause = useCallback((id: string) => {
    Alert.alert("Tạm dừng khung giờ", "Khung giờ sẽ tạm dừng cho đến khi bạn kích hoạt lại.", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Tạm dừng",
        onPress: () => {
          pauseMutation.mutate(id, {
            onSuccess: () => handleInvalidate(),
          });
        },
      },
    ]);
  }, [pauseMutation, handleInvalidate]);

  const handleResume = useCallback((id: string) => {
    resumeMutation.mutate(id, {
      onSuccess: () => handleInvalidate(),
    });
  }, [resumeMutation, handleInvalidate]);

  const handleCancel = useCallback((id: string) => {
    Alert.alert("Huỷ khung giờ", "Hành động này không thể hoàn tác.", [
      { text: "Đóng", style: "cancel" },
      {
        text: "Huỷ khung giờ",
        style: "destructive",
        onPress: () => {
          cancelMutation.mutate(id, {
            onSuccess: () => handleInvalidate(),
          });
        },
      },
    ]);
  }, [cancelMutation, handleInvalidate]);

  const handleCreateTemplate = useCallback(() => {
    Alert.alert(
      "Tạo khung giờ mới",
      "Việc tạo khung giờ sẽ trừ lượt sử dụng trong gói đăng ký tháng. Nếu đã hết lượt, số dư ví sẽ bị trừ tương ứng. Bạn có chắc chắn muốn tiếp tục?",
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Tiếp tục",
          onPress: () =>
            navigation.navigate("FixedSlotEditor", {
              stationId,
              stationName,
            }),
        },
      ],
    );
  }, [navigation, stationId, stationName]);

  const headerTitle = useMemo(() => {
    if (stationName)
      return stationName;
    return "Khung giờ cố định";
  }, [stationName]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[BikeColors.primary, BikeColors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{headerTitle}</Text>
          <Text style={styles.headerSubtitle}>Quản lý các khung giờ giữ xe</Text>
        </View>
      </LinearGradient>

      <View style={styles.filterRow}>
        <FlatList
          data={STATUS_FILTERS}
          keyExtractor={(item) => item.label}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => {
            const isActive = item.value === statusFilter || (!item.value && !statusFilter);
            return (
              <TouchableOpacity
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setStatusFilter(item.value)}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateTemplate}
        >
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={styles.createButtonText}>Tạo khung giờ</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={data?.data ?? []}
        keyExtractor={(item, index) => `${item._id}-${index}`}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          isLoading
            ? (
                <View style={styles.emptyState}>
                  <ActivityIndicator color={BikeColors.primary} size="large" />
                  <Text style={styles.emptyText}>Đang tải khung giờ...</Text>
                </View>
              )
            : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>Chưa có khung giờ nào.</Text>
                </View>
              )
        }
        renderItem={({ item }) => (
          <FixedSlotTemplateCard
            template={item}
            onPause={() => handlePause(item._id)}
            onResume={() => handleResume(item._id)}
            onCancel={() => handleCancel(item._id)}
            onSelect={() => navigation.navigate("FixedSlotDetail", { templateId: item._id })}
          />
        )}
      />
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
  headerSubtitle: {
    color: "rgba(255,255,255,0.8)",
  },
  filterRow: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: BikeColors.surface,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: BikeColors.primary,
  },
  filterText: {
    color: BikeColors.textPrimary,
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#fff",
  },
  createButton: {
    marginTop: 8,
    backgroundColor: BikeColors.primary,
    paddingVertical: 12,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  listContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  emptyState: {
    padding: 32,
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    color: BikeColors.textSecondary,
  },
});
