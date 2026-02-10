import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSOS } from "@/hooks/use-sos";
import { useAuthNext } from "@/providers/auth-provider-next";
import type { SOSDetail } from "@/types/SOS";
import { formatVietnamDateTime } from "@/utils/date";
import { resolveSOSSchema, type ResolveSOSSchema } from "@/schema/sosSchema";

type RouteParams = {
  sosId: string;
};

export default function SOSAgentDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { sosId } = route.params as RouteParams;
  const { isAuthenticated } = useAuthNext();
  const [refreshing, setRefreshing] = useState(false);

  const {
    sosDetail,
    isLoadingSOSDetail,
    refetchSOSDetail,
    confirmSOSRequest,
    resolveSOSRequest,
  } = useSOS({
    hasToken: isAuthenticated,
    page: 1,
    limit: 10,
    id: sosId,
  });

  useEffect(() => {
    if (sosId) {
      refetchSOSDetail();
    }
  }, [sosId, refetchSOSDetail]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchSOSDetail();
    setRefreshing(false);
  }, [refetchSOSDetail]);

  const detail = sosDetail?.result as SOSDetail | undefined;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ĐANG CHỜ XỬ LÍ":
        return "#FF9800";
      case "ĐÃ GỬI NGƯỜI CỨU HỘ":
        return "#2196F3";
      case "ĐANG TRÊN ĐƯỜNG ĐẾN":
        return "#9C27B0";
      case "ĐÃ XỬ LÍ":
        return "#4CAF50";
      case "KHÔNG XỬ LÍ ĐƯỢC":
        return "#F44336";
      case "ĐÃ TỪ CHỐI":
        return "#FF6B6B";
      default:
        return "#999";
    }
  };

  const handleConfirmSOS = async () => {
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc chắn đang trên đường đến hỗ trợ người dùng?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xác nhận",
          onPress: async () => {
            try {
              await confirmSOSRequest();
              await refetchSOSDetail();
              Alert.alert("Thành công", "Đã xác nhận đang trên đường đến");
            } catch (error) {
              Alert.alert("Lỗi", "Không thể xác nhận yêu cầu");
            }
          },
        },
      ]
    );
  };

  const handleResolveSOS = (solvable: boolean) => {
    (navigation as any).navigate("ResolveSOSForm", {
      sosId,
      solvable,
    });
  };

  if (isLoadingSOSDetail || !detail) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
        <LinearGradient
          colors={["#0066FF", "#00B4D8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 16 }]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Chi tiết yêu cầu SOS</Text>
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066FF" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </View>
    );
  }

  const statusColor = getStatusColor(detail.status);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
      <LinearGradient
        colors={["#0066FF", "#00B4D8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết yêu cầu SOS</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0066FF"]} />
        }
      >
        {/* Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Thông tin chung</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Trạng thái</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{detail.status}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Vấn đề</Text>
            <Text style={styles.value}>{detail.issue}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tạo lúc</Text>
            <Text style={styles.value}>{formatVietnamDateTime(detail.created_at)}</Text>
          </View>
          {detail.resolved_at && (
            <View style={styles.row}>
              <Text style={styles.label}>Giải quyết</Text>
              <Text style={styles.value}>{formatVietnamDateTime(detail.resolved_at)}</Text>
            </View>
          )}
        </View>

        {/* Requester Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Người yêu cầu</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Tên</Text>
            <Text style={styles.value}>{detail.requester.fullname}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>SĐT</Text>
            <Text style={styles.value}>{detail.requester.phone_number}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value} numberOfLines={1}>
              {detail.requester.email}
            </Text>
          </View>
        </View>

        {/* Bike Section */}
        {detail.bike && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🚲 Thông tin xe</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Chip ID</Text>
              <Text style={styles.value}>{detail.bike.chip_id || "-"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Trạng thái</Text>
              <Text style={styles.value}>{detail.bike.status}</Text>
            </View>
          </View>
        )}

        {/* Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Vị trí</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Vĩ độ</Text>
            <Text style={styles.value}>{detail.location?.coordinates[1]}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Kinh độ</Text>
            <Text style={styles.value}>{detail.location?.coordinates[0]}</Text>
          </View>
        </View>

        {/* Agent Notes Section */}
        {detail.agent_notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Ghi chú của Agent</Text>
            <Text style={[styles.value, { textAlign: "left", marginTop: 8 }]}>
              {detail.agent_notes}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        {detail.status === "ĐÃ GỬI NGƯỜI CỨU HỘ" && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton]}
              onPress={handleConfirmSOS}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={22} color="#fff" />
              <Text style={styles.actionButtonText}>Xác nhận đang đến</Text>
            </TouchableOpacity>
          </View>
        )}

        {detail.status === "ĐANG TRÊN ĐƯỜNG ĐẾN" && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.resolveButton]}
              onPress={() => handleResolveSOS(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-done" size={22} color="#fff" />
              <Text style={styles.actionButtonText}>Đã xử lý xong</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleResolveSOS(false)}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle" size={22} color="#fff" />
              <Text style={styles.actionButtonText}>Không xử lý được</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#0066FF",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  label: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
    width: 100,
  },
  value: {
    fontSize: 14,
    color: "#333",
    flex: 1,
    textAlign: "right",
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  actionButtons: {
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  confirmButton: {
    backgroundColor: "#2196F3",
  },
  resolveButton: {
    backgroundColor: "#4CAF50",
  },
  rejectButton: {
    backgroundColor: "#F44336",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
