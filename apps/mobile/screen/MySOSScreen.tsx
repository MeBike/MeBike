import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSOS } from "@hooks/use-sos";
import { useAuth } from "@providers/auth-providers";
import type { SOS } from "@/types/SOS";
import { formatVietnamDateTime } from "@/utils/date";
const MySOSScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const hasToken = Boolean(user?._id);
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [allSOSData, setAllSOSData] = useState<SOS[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);

  const { sosRequests, isLoading, refetchSOSRequest } = useSOS({
    hasToken,
    page,
    limit,
  });

  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Accumulate data when sosRequests changes
  React.useEffect(() => {
    if (sosRequests?.data) {
      if (page === 1) {
        // Reset data when refreshing or initial load
        setAllSOSData(sosRequests.data);
      } else {
        // Append new data for pagination
        setAllSOSData(prev => [...prev, ...sosRequests.data]);
      }
      setLoadingMore(false);
    }
    // Update total records
    if (sosRequests?.pagination?.totalRecords !== undefined) {
      setTotalRecords(sosRequests.pagination.totalRecords);
    }
  }, [sosRequests?.data, page]);

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await refetchSOSRequest();
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (loadingMore || isLoading || !sosRequests?.pagination) return;
    
    const { currentPage, totalPages } = sosRequests.pagination;
    if (currentPage >= totalPages) return;

    setLoadingMore(true);
    setPage(currentPage + 1);
    // refetchSOSRequest will be triggered by the page change
  };

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ĐANG CHỜ XỬ LÍ":
        return "time-outline";
      case "ĐÃ GỬI NGƯỜI CỨU HỘ":
        return "people-outline";
      case "ĐANG TRÊN ĐƯỜNG ĐẾN":
        return "car-outline";
      case "ĐÃ XỬ LÍ":
        return "checkmark-circle";
      case "KHÔNG XỬ LÍ ĐƯỢC":
        return "close-circle";
      case "ĐÃ TỪ CHỐI":
        return "ban";
      default:
        return "help-circle";
    }
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

  const handleSOSPress = (sosId: string) => {
    (navigation as any).navigate("MySOSDetail", { sosId });
  };

  const renderSOSItem = ({ item }: { item: SOS }) => {
    const statusColor = getStatusColor(item.status);
    const statusIcon = getStatusIcon(item.status);

    return (
      <TouchableOpacity
        style={styles.sosCard}
        onPress={() => handleSOSPress(item._id)}
        activeOpacity={0.7}
      >
        <View style={styles.sosCardHeader}>
          <View style={styles.sosCardTitleRow}>
            <Ionicons name="alert-circle" size={24} color="#FF3B30" />
            <Text style={styles.sosCardTitle} numberOfLines={1}>
              Yêu cầu #{item._id.slice(-6).toUpperCase()}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Ionicons name={statusIcon as any} size={14} color="#fff" />
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.sosCardBody}>
          <View style={styles.infoRow}>
            <Ionicons name="document-text-outline" size={18} color="#666" />
            <Text style={styles.infoLabel}>Vấn đề:</Text>
          </View>
          <Text style={styles.issueText} numberOfLines={2}>
            {item.issue}
          </Text>
        </View>

        <View style={styles.sosCardFooter}>
          <View style={styles.footerItem}>
            <Ionicons name="time-outline" size={16} color="#999" />
            <Text style={styles.footerText}>
              {formatVietnamDateTime(item.created_at)}
            </Text>
          </View>
          {item.location?.coordinates &&
            item.location.coordinates.length >= 2 && (
              <View style={styles.footerItem}>
                <Ionicons name="location-outline" size={16} color="#999" />
                <Text style={styles.footerText}>
                  {String(item.location.coordinates[1]).slice(0, 9)},{" "}
                  {String(item.location.coordinates[0]).slice(0, 9)}
                </Text>
              </View>
            )}
        </View>

        <View style={styles.chevronContainer}>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="alert-circle-outline" size={80} color="#ccc" />
      <Text style={styles.emptyStateTitle}>Chưa có yêu cầu cứu hộ</Text>
      <Text style={styles.emptyStateSubtitle}>
        Các yêu cầu cứu hộ của bạn sẽ hiển thị ở đây
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#FF3B30", "#FF6B6B"]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Ionicons name="medical" size={28} color="#fff" />
            <Text style={styles.headerTitle}>Yêu cầu cứu hộ của tôi</Text>
          </View>
          <View style={styles.headerPlaceholder} />
        </View>
      </LinearGradient>

      {/* Stats Card */}
      <View style={styles.statsCard}>
        <View style={styles.statsItem}>
          <Text style={styles.statsValue}>{totalRecords}</Text>
          <Text style={styles.statsLabel}>Tổng yêu cầu</Text>
        </View>


      </View>

      {/* SOS List */}
      {isLoading && !refreshing && page === 1 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF3B30" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : (
        <FlatList
          data={allSOSData}
          renderItem={renderSOSItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#FF3B30"]}
              tintColor="#FF3B30"
            />
          }
          ListEmptyComponent={renderEmptyState}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color="#FF3B30" />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  headerPlaceholder: {
    width: 44,
  },
  statsCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: -10,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-around",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsItem: {
    alignItems: "center",
  },
  statsValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  statsDivider: {
    width: 1,
    backgroundColor: "#e0e0e0",
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  sosCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: "relative",
  },
  sosCardHeader: {
    marginBottom: 12,
  },
  sosCardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sosCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  sosCardBody: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  issueText: {
    fontSize: 14,
    color: "#1a1a1a",
    lineHeight: 20,
    marginLeft: 24,
  },
  sosCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: "#999",
  },
  chevronContainer: {
    position: "absolute",
    right: 16,
    top: "50%",
    marginTop: -10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: "center",
  },
});

export default MySOSScreen;
