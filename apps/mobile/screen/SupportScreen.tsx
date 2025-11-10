import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useReportActions } from "@hooks/useReportActions";
import { LoadingScreen } from "@components/LoadingScreen";
import type { Report } from "../services/report.service";
import type { SupportScreenNavigationProp } from "../types/navigation";

function SupportScreen() {
  const navigation = useNavigation<SupportScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = React.useState(false);
  const {
    userReports,
    isLoadingUserReports,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetchUserReports,
  } = useReportActions({ limit: 5 });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetchUserReports();
    setRefreshing(false);
  }, [refetchUserReports]);



  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "#FF9800";
      case "InProgress":
        return "#2196F3";
      case "Resolved":
        return "#4CAF50";
      case "Cancel":
        return "#F44336";
      default:
        return "#999";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "Pending":
        return "Chờ xử lý";
      case "InProgress":
        return "Đang xử lý";
      case "Resolved":
        return "Đã giải quyết";
      case "Cancel":
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
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
        <Text style={styles.reportDate}>{formatDate(item.created_at)}</Text>
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
      <LinearGradient
        colors={["#0066FF", "#00B4D8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hỗ trợ & Báo cáo</Text>
      </LinearGradient>

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

        {userReports.length > 0 ? (
          <FlatList
            data={userReports}
            renderItem={renderReportCard}
            keyExtractor={(item) => item._id}
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
});

export default SupportScreen;
