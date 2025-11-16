import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  FlatList,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSOS } from "@/hooks/use-sos";
import { useAuth } from "@/providers/auth-providers";
import type { SOS } from "@/types/SOS";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/types/navigation";
import type { ResolveSOSSchema } from "@/schema/sosSchema";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SOSAgentDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [selectedSOS, setSelectedSOS] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const {
    sosRequests,
    isLoading,
    refetchSOSRequest,
    sosDetail,
    isLoadingSOSDetail,
    refetchSOSDetail,
    confirmSOSRequest,
    resolveSOSRequest,
  } = useSOS({
    hasToken: isAuthenticated,
    page,
    limit,
    id: selectedSOS || undefined,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchSOSRequest();
    if (selectedSOS) {
      await refetchSOSDetail();
    }
    setRefreshing(false);
  }, [refetchSOSRequest, refetchSOSDetail, selectedSOS]);

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
        return "#757575";
      default:
        return "#999";
    }
  };

  const handleConfirmSOS = async () => {
    if (!selectedSOS) return;
    
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc chắn muốn xác nhận yêu cầu SOS này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xác nhận",
          onPress: async () => {
            await confirmSOSRequest();
          },
        },
      ]
    );
  };

  const handleResolveSOS = (solvable: boolean) => {
    if (!selectedSOS) return;

    const onSubmit = async (data: ResolveSOSSchema) => {
      await resolveSOSRequest(data);
      await refetchSOSRequest();
      await refetchSOSDetail();
    };

    navigation.navigate("ResolveSOSScreen", {
      sosId: selectedSOS,
      solvable,
      onSubmit,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderSOSItem = ({ item }: { item: SOS }) => (
    <TouchableOpacity
      style={styles.sosCard}
      onPress={() => setSelectedSOS(item._id)}
      activeOpacity={0.7}
    >
      <View style={styles.sosCardHeader}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
        <Text style={styles.sosDate}>{formatDate(item.created_at)}</Text>
      </View>

      <Text style={styles.sosIssue} numberOfLines={3}>
        {item.issue}
      </Text>

      <View style={styles.sosFooter}>
        <View style={styles.sosInfoRow}>
          <Ionicons name="person-outline" size={16} color="#666" />
          <Text style={styles.sosInfoText}>
            {item.requester_id.substring(0, 8)}...
          </Text>
        </View>
        {item.sos_agent_id && (
          <View style={styles.sosInfoRow}>
            <Ionicons name="medkit-outline" size={16} color="#2196F3" />
            <Text style={[styles.sosInfoText, { color: "#2196F3" }]}>
              Đã được assign
            </Text>
          </View>
        )}
      </View>

      <View style={styles.arrowIcon}>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </View>
    </TouchableOpacity>
  );

  const renderSOSDetail = () => {
    if (isLoadingSOSDetail) {
      return (
        <View style={styles.detailLoading}>
          <ActivityIndicator size="large" color="#0066FF" />
          <Text style={styles.loadingText}>Đang tải chi tiết...</Text>
        </View>
      );
    }

    if (!sosDetail?.result) {
      return (
        <View style={styles.detailPlaceholder}>
          <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
          <Text style={styles.detailPlaceholderText}>
            Không tìm thấy thông tin
          </Text>
        </View>
      );
    }

    const detail = sosDetail.result;

    return (
      <ScrollView 
        style={styles.detailScrollView}
        contentContainerStyle={styles.detailScrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>📋 Thông tin chung</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Trạng thái</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(detail.status) },
              ]}
            >
              <Text style={styles.statusText}>{detail.status}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Vấn đề</Text>
            <Text style={styles.detailValue}>{detail.issue}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tạo lúc</Text>
            <Text style={styles.detailValue}>{formatDate(detail.created_at)}</Text>
          </View>
          {detail.resolved_at && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Giải quyết</Text>
              <Text style={styles.detailValue}>
                {formatDate(detail.resolved_at)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>👤 Người yêu cầu</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tên</Text>
            <Text style={styles.detailValue}>{detail.requester.fullname}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>SĐT</Text>
            <Text style={styles.detailValue}>{detail.requester.phone_number}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {detail.requester.email}
            </Text>
          </View>
        </View>

        {detail.bike && (
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>🚲 Thông tin xe</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>ID Xe</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {detail.bike._id}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Trạng thái</Text>
              <Text style={styles.detailValue}>{detail.bike.status}</Text>
            </View>
          </View>
        )}

        {detail.agent_notes && (
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>📝 Ghi chú của Agent</Text>
            <Text style={[styles.detailValue, { textAlign: "left", marginTop: 8 }]}>
              {detail.agent_notes}
            </Text>
          </View>
        )}

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
    );
  };

  if (selectedSOS) {
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
              onPress={() => setSelectedSOS(null)}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Chi tiết yêu cầu SOS</Text>
          </View>
        </LinearGradient>
        {renderSOSDetail()}
      </View>
    );
  }

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
          <Ionicons name="alert-circle" size={32} color="#fff" />
          <Text style={styles.headerTitle}>Quản lý SOS</Text>
        </View>
      </LinearGradient>

      <View style={styles.fullContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0066FF" />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        ) : sosRequests?.data && sosRequests.data.length > 0 ? (
          <FlatList
            data={sosRequests.data}
            renderItem={renderSOSItem}
            keyExtractor={(item) => item._id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Không có yêu cầu SOS nào</Text>
          </View>
        )}
      </View>
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
  fullContainer: {
    flex: 1,
    padding: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  sosCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    position: "relative",
  },
  sosCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
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
  sosDate: {
    fontSize: 12,
    color: "#999",
    fontWeight: "500",
  },
  sosIssue: {
    fontSize: 15,
    color: "#333",
    marginBottom: 12,
    lineHeight: 22,
    fontWeight: "500",
  },
  sosFooter: {
    flexDirection: "row",
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  sosInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sosInfoText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  arrowIcon: {
    position: "absolute",
    right: 16,
    top: "50%",
    marginTop: -10,
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginTop: 16,
  },
  detailScrollView: {
    flex: 1,
  },
  detailScrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  detailContent: {
    flex: 1,
  },
  detailSection: {
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
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#0066FF",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
    flex: 1,
    textAlign: "right",
    fontWeight: "500",
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
  detailPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  detailPlaceholderText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginTop: 16,
  },
  detailLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
