import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
  Image,
  Dimensions,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatVietnamDateTime } from "@/utils/date";
import { useReportActions } from "@hooks/useReportActions";
import type { ReportDetailRouteProp } from "../types/navigation";
import { ReportStatus } from "@/services/report.service";
function ReportDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<ReportDetailRouteProp>();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = React.useState(false);
  const { reportDetailData, isLoadingReportDetail, refetchReportDetail } =
    useReportActions({
      id: route.params.reportId,
    });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetchReportDetail();
    setRefreshing(false);
  }, [refetchReportDetail]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case ReportStatus.Pending:
        return "#60a5fa"; // processing - light blue
      case ReportStatus.InProgress:
        return "#3b82f6"; // pending - blue
      case ReportStatus.Resolved:
        return "#10b981"; // success - green
      case ReportStatus.CannotResolved:
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

  const renderMediaGrid = () => {
    if (
      !reportDetailData?.result.media_urls ||
      reportDetailData.result.media_urls.length === 0
    ) {
      return null;
    }

    const images = reportDetailData.result.media_urls;
    const imageWidth = Dimensions.get("window").width - 16 * 2;

    return (
      <>
        <Text style={styles.mediaTitle}>Hình ảnh đính kèm</Text>
        {images.map((url, index) => (
          <View key={index} style={styles.mediaImageContainer}>
            <Image
              source={{ uri: url }}
              style={[
                styles.mediaImage,
                { width: imageWidth, height: imageWidth * 0.75 },
              ]}
            />
          </View>
        ))}
      </>
    );
  };

  if (isLoadingReportDetail) {
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
          <Text style={styles.headerTitle}>Chi tiết báo cáo</Text>
        </LinearGradient>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066FF" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </View>
    );
  }

  if (!reportDetailData) {
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
          <Text style={styles.headerTitle}>Chi tiết báo cáo</Text>
        </LinearGradient>

        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Không tìm thấy báo cáo</Text>
        </View>
      </View>
    );
  }

  const report = reportDetailData.result;

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
        <Text style={styles.headerTitle}>Chi tiết báo cáo</Text>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.typeContainer}>
              <Ionicons name="document-text" size={24} color="#0066FF" />
              <Text style={styles.reportType}>{getTypeText(report.type)}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(report.status) },
              ]}
            >
              <Text style={styles.statusText}>
                {getStatusText(report.status)}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Nội dung</Text>
            <Text style={styles.detailValue}>{report.message}</Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Ngày tạo</Text>
            <Text style={styles.detailValue}>
              {formatVietnamDateTime(report.created_at)}
            </Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Trạng thái cập nhật lần cuối</Text>
            <Text style={styles.detailValue}>
              {formatVietnamDateTime(report.updated_at)}
            </Text>
          </View>

          {report.priority && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Độ ưu tiên</Text>
              <Text style={styles.detailValue}>{report.priority}</Text>
            </View>
          )}
        </View>

        <View style={styles.mediaSection}>{renderMediaGrid()}</View>

        <View style={{ height: 20 }} />

        {/* Spacer to ensure scrollable content */}
        <View style={{ height: 50 }} />
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
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
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
    flex: 1,
  },
  reportType: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginLeft: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 16,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
  mediaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 8,
  },
  mediaList: {
    marginTop: 8,
  },
  mediaImageContainer: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: "hidden",
  },
  mediaImage: {
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  mediaCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mediaTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  mediaSection: {
    paddingHorizontal: 0,
    paddingVertical: 16,
  },
});

export default ReportDetailScreen;
