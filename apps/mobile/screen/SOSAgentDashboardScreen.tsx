import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  StatusBar,
  ScrollView,
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
import { formatVietnamDateTime } from "@/utils/date";
import { useQueryClient } from "@tanstack/react-query";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SOSAgentDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [refreshing, setRefreshing] = useState(false);
  const [allSOSRequests, setAllSOSRequests] = useState<SOS[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);

  const {
    sosRequests,
    isLoading,
    refetchSOSRequest,
  } = useSOS({
    hasToken: isAuthenticated,
    page,
    limit,
    status: selectedStatus as any,
  });

  // Update allSOSRequests when new data arrives
  React.useEffect(() => {
    if (sosRequests?.data) {
      if (page === 1) {
        // Reset list on first page
        setAllSOSRequests(sosRequests.data);
      } else {
        // Append new items for pagination, filter out duplicates
        setAllSOSRequests(prev => {
          const existingIds = new Set(prev.map(item => item._id));
          const newItems = sosRequests.data.filter(item => !existingIds.has(item._id));
          return [...prev, ...newItems];
        });
      }
      setLoadingMore(false);
    }
    // Update total records
    if (sosRequests?.pagination?.totalRecords !== undefined) {
      setTotalRecords(sosRequests.pagination.totalRecords);
    }
  }, [sosRequests?.data, page]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    await queryClient.invalidateQueries({
      queryKey: ["sos-requests"],
      refetchType: "all",
    });
    setRefreshing(false);
  }, [queryClient]);

  const statusFilters = [
    { label: "Tất cả", value: undefined },
    { label: "Đã gửi cứu hộ", value: "ĐÃ GỬI NGƯỜI CỨU HỘ" },
    { label: "Đang đến", value: "ĐANG TRÊN ĐƯỜNG ĐẾN" },
    { label: "Đã xử lý", value: "ĐÃ XỬ LÍ" },
    { label: "Không xử lý được", value: "KHÔNG XỬ LÍ ĐƯỢC" },
    { label: "Đã từ chối", value: "ĐÃ TỪ CHỐI" },
    { label: "Đã hủy", value: "ĐÃ HUỶ" },
  ];

  const handleStatusFilter = (status: string | undefined) => {
    setSelectedStatus(status);
    setPage(1); // Reset to first page when changing filter
    setAllSOSRequests([]); // Clear current data
  };

  const loadMore = useCallback(() => {
    if (loadingMore || isLoading || !sosRequests?.pagination) return;
    
    const { currentPage, totalPages } = sosRequests.pagination;
    if (currentPage >= totalPages) return;

    setLoadingMore(true);
    setPage(currentPage + 1);
    // refetchSOSRequest will be triggered by the page change
  }, [loadingMore, isLoading, sosRequests]);

  const getStatusColor = (status: string) => {
    switch (status) {
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

  const renderSOSItem = ({ item }: { item: SOS }) => (
    <TouchableOpacity
      style={styles.sosCard}
      onPress={() => navigation.navigate("SOSAgentDetail", { sosId: item._id })}
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
        <Text style={styles.sosDate}>
          {formatVietnamDateTime(item.created_at)}
        </Text>
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

      {/* Status Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {statusFilters.map((filter) => (
            <TouchableOpacity
              key={filter.label}
              style={[
                styles.filterTab,
                selectedStatus === filter.value && styles.filterTabActive,
              ]}
              onPress={() => handleStatusFilter(filter.value)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  selectedStatus === filter.value && styles.filterTabTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.fullContainer}>
        {isLoading && page === 1 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0066FF" />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        ) : allSOSRequests.length > 0 ? (
          <FlatList
            data={allSOSRequests}
            renderItem={renderSOSItem}
            keyExtractor={(item, index) => `${item._id}-${index}`}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color="#0066FF" />
                </View>
              ) : null
            }
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
  loadingMore: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  filterContainer: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  filterScrollContent: {
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  filterTabActive: {
    backgroundColor: "#0066FF",
    borderColor: "#0066FF",
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  filterTabTextActive: {
    color: "#fff",
  },
});
