import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";

import { ScreenHeader } from "@components/ScreenHeader";

import { useReportActions } from "@hooks/useReportActions";
import { LoadingScreen } from "@components/LoadingScreen";
import type { Report } from "../services/report.service";
import { ReportStatus } from "../services/report.service";
import type { SupportScreenNavigationProp } from "../types/navigation";
import { formatVietnamDateTime } from "@/utils/date";

function SupportScreen() {
  const navigation = useNavigation<SupportScreenNavigationProp>();
  const [refreshing, setRefreshing] = React.useState(false);
  const [selectedStatus, setSelectedStatus] = React.useState<ReportStatus | undefined>(undefined);

  const {
    userReports,
    isLoadingUserReports,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetchUserReports,
  } = useReportActions({ limit: 5, status: selectedStatus });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetchUserReports();
    setRefreshing(false);
  }, [refetchUserReports]);

  const statusFilters = [
    { label: "Tất cả", value: undefined },
    { label: "Đang chờ", value: ReportStatus.Pending },
    { label: "Đang xử lý", value: ReportStatus.InProgress },
    { label: "Đã giải quyết", value: ReportStatus.Resolved },
    { label: "Không thể giải quyết", value: ReportStatus.CannotResolved },
    { label: "Đã hủy", value: ReportStatus.Cancel },
  ];

  const handleStatusFilter = (status: ReportStatus | undefined) => {
    setSelectedStatus(status);
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case ReportStatus.Pending:
        return "#60a5fa"; // processing - light blue
      case ReportStatus.InProgress:
        return "#3b82f6"; // pending - blue
      case ReportStatus.Resolved:
        return "#10b981"; // success - green
      case ReportStatus.CannotResolved:
        return "#9ca3af"; // unsolvable - gray
      case ReportStatus.Cancel:
        return "#ef4444"; // destructive - red
      default:
        return "#999";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case ReportStatus.Pending:
        return "Đang chờ xử lý";
      case ReportStatus.InProgress:
        return "Đang xử lý";
      case ReportStatus.Resolved:
        return "Đã giải quyết";
      case ReportStatus.CannotResolved:
        return "Không thể giải quyết được";
      case ReportStatus.Cancel:
        return "Đã hủy";
      default:
        return status;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case "BikeDamage":
        return "Xe bị hỏng";
      case "BikeDirty":
        return "Xe bẩn";
      case "StationIssue":
        return "Vấn đề trạm";
      case "Other":
        return "Khác";
      default:
        return type;
    }
  };


  const renderReportCard = ({ item }: { item: Report }) => (
    <TouchableOpacity 
      onPress={() => (navigation as any).navigate("ReportDetail", { reportId: item._id })}
    >
      <View style={styles.reportCard}>
      <View style={styles.cardHeader}>
        <View style={styles.typeContainer}>
          <Ionicons name="document-text" size={20} color="#0066FF" />
          <Text style={styles.reportType}>{getTypeText(item.type)}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardContent}>
        <Text style={styles.reportMessage} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.reportDate}>{formatVietnamDateTime(item.created_at)}</Text>
      </View>

      {item.media_urls && item.media_urls.length > 0 && (
        <View style={styles.mediaIndicator}>
          <Ionicons name="images" size={16} color="#666" />
          <Text style={styles.mediaText}>
            {item.media_urls.length} hình ảnh
          </Text>
        </View>
      )}
      </View>
    </TouchableOpacity>
  );

  if (isLoadingUserReports) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
      <ScreenHeader
        title="Hỗ trợ & Báo cáo"
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.content}>
        {/* <TouchableOpacity
          style={styles.createReportButton}
          onPress={() => {
            (navigation as any).navigate("Report");
          }}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.createReportButtonText}>Tạo báo cáo mới</Text>
        </TouchableOpacity> */}

        <Text style={styles.sectionTitle}>Lịch sử báo cáo</Text>

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

        {userReports.length > 0 ? (
          <FlatList
            data={userReports}
            renderItem={renderReportCard}
            keyExtractor={(item, index) => `${item._id}-${index}`}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#0066FF"]}
                tintColor="#0066FF"
              />
            }
            ListFooterComponent={
              isFetchingNextPage ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color="#0066FF" />
                  <Text style={styles.loadingMoreText}>Đang tải thêm...</Text>
                </View>
              ) : null
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Chưa có báo cáo nào</Text>
            <Text style={styles.emptySubtext}>
              Khi bạn tạo báo cáo, chúng sẽ hiển thị ở đây
            </Text>
          </View>
        )}
      </View>

      {/* Modal detail view removed - using separate screen */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  createReportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0066FF",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  createReportButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 24,
  },
  reportCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  reportType: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 12,
  },
  cardContent: {
    marginBottom: 8,
  },
  reportMessage: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginBottom: 8,
  },
  reportDate: {
    fontSize: 12,
    color: "#666",
  },
  mediaIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  mediaText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  loadingMore: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
    color: "#666",
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
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

export default SupportScreen;
