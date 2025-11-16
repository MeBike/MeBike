import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSOS } from "@hooks/use-sos";
import { useAuth } from "@providers/auth-providers";
import type { SOSDetail } from "@/types/SOS";

type RouteParams = {
  sosId: string;
};

const MySOSDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { sosId } = route.params as RouteParams;
  const { user } = useAuth();
  const hasToken = Boolean(user?._id);

  const { sosDetail, isLoadingSOSDetail, refetchSOSDetail } = useSOS({
    hasToken,
    page: 1,
    limit: 10,
    id: sosId,
  });

  useEffect(() => {
    if (sosId) {
      refetchSOSDetail();
    }
  }, [sosId]);

  const detail = sosDetail?.result as SOSDetail | undefined;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ĐANG CHỜ XỬ LÍ":
        return "#FFA500";
      case "ĐÃ GỬI NGƯỜI CỨU HỘ":
        return "#3B82F6";
      case "ĐANG TRÊN ĐƯỜNG ĐẾN":
        return "#8B5CF6";
      case "ĐÃ XỬ LÍ":
        return "#10B981";
      case "KHÔNG XỬ LÍ ĐƯỢC":
        return "#EF4444";
      case "ĐÃ TỪ CHỐI":
        return "#6B7280";
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
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoadingSOSDetail || !detail) {
    return (
      <View style={styles.container}>
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
            <Text style={styles.headerTitle}>Chi tiết yêu cầu</Text>
            <View style={styles.headerPlaceholder} />
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF3B30" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </View>
    );
  }

  const statusColor = getStatusColor(detail.status);
  const statusIcon = getStatusIcon(detail.status);

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
          <Text style={styles.headerTitle}>Chi tiết yêu cầu</Text>
          <View style={styles.headerPlaceholder} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <View style={styles.card}>
          <View style={styles.statusHeader}>
            <Ionicons name={statusIcon as any} size={32} color={statusColor} />
            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>Trạng thái</Text>
              <Text style={[styles.statusValue, { color: statusColor }]}>
                {detail.status}
              </Text>
            </View>
          </View>
          <View style={styles.statusTimeline}>
            <View style={styles.timelineItem}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.timelineText}>
                Tạo lúc: {formatDate(detail.created_at)}
              </Text>
            </View>
            {detail.resolved_at && (
              <View style={styles.timelineItem}>
                <Ionicons name="checkmark-done-outline" size={16} color="#666" />
                <Text style={styles.timelineText}>
                  Xử lý lúc: {formatDate(detail.resolved_at)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Request Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text" size={24} color="#FF3B30" />
            <Text style={styles.cardTitle}>Thông tin yêu cầu</Text>
          </View>
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>Mã yêu cầu:</Text>
            <Text style={styles.infoValue}>#{detail._id.slice(-8).toUpperCase()}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>Vấn đề:</Text>
            <Text style={styles.issueText}>{detail.issue}</Text>
          </View>
        </View>

        {/* Location Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="location" size={24} color="#FF3B30" />
            <Text style={styles.cardTitle}>Vị trí</Text>
          </View>
          <View style={styles.locationInfo}>
            <View style={styles.coordinateRow}>
              <Text style={styles.coordinateLabel}>Vĩ độ:</Text>
              <Text style={styles.coordinateValue}>
                {detail.location?.coordinates[1]}
              </Text>
            </View>
            <View style={styles.coordinateRow}>
              <Text style={styles.coordinateLabel}>Kinh độ:</Text>
              <Text style={styles.coordinateValue}>
                {detail.location?.coordinates[0]}
              </Text>
            </View>
          </View>
        </View>

        {/* Rental Info Card */}
        {detail.rental && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="bicycle" size={24} color="#FF3B30" />
              <Text style={styles.cardTitle}>Thông tin thuê xe</Text>
            </View>
            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Mã thuê xe:</Text>
              <Text style={styles.infoValue}>
                #{detail.rental._id.slice(-8).toUpperCase()}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Trạng thái:</Text>
              <Text style={styles.infoValue}>{detail.rental.status}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Bắt đầu:</Text>
              <Text style={styles.infoValue}>
                {formatDate(detail.rental.start_time)}
              </Text>
            </View>
          </View>
        )}

        {/* Agent Info Card */}
        {detail.sos_agent && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="person" size={24} color="#FF3B30" />
              <Text style={styles.cardTitle}>Nhân viên cứu hộ</Text>
            </View>
            <View style={styles.agentInfo}>
              <Image
                source={{
                  uri:
                    detail.sos_agent.avatar ||
                    "https://via.placeholder.com/60",
                }}
                style={styles.agentAvatar}
              />
              <View style={styles.agentDetails}>
                <Text style={styles.agentName}>{detail.sos_agent.fullname}</Text>
                <Text style={styles.agentPhone}>
                  {detail.sos_agent.phone_number}
                </Text>
              </View>
            </View>
            {detail.agent_notes && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoSection}>
                  <Text style={styles.infoLabel}>Ghi chú:</Text>
                  <Text style={styles.issueText}>{detail.agent_notes}</Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* Photos Card */}
        {detail.photos && detail.photos.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="images" size={24} color="#FF3B30" />
              <Text style={styles.cardTitle}>Hình ảnh ({detail.photos.length})</Text>
            </View>
            <View style={styles.photosGrid}>
              {detail.photos.map((photo, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.photoContainer}
                  onPress={() => {
                    // Could open full screen image viewer
                    Alert.alert("Xem ảnh", photo);
                  }}
                >
                  <Image source={{ uri: photo }} style={styles.photo} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Reason Card (if rejected) */}
        {detail.reason && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="information-circle" size={24} color="#EF4444" />
              <Text style={styles.cardTitle}>Lý do</Text>
            </View>
            <Text style={styles.reasonText}>{detail.reason}</Text>
          </View>
        )}
      </ScrollView>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  headerPlaceholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
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
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  statusTimeline: {
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timelineText: {
    fontSize: 14,
    color: "#666",
  },
  infoSection: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 16,
    color: "#1a1a1a",
    fontWeight: "600",
  },
  issueText: {
    fontSize: 15,
    color: "#1a1a1a",
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 12,
  },
  locationInfo: {
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 16,
  },
  coordinateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  coordinateLabel: {
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  },
  coordinateValue: {
    fontSize: 15,
    color: "#1a1a1a",
    fontWeight: "700",
    fontFamily: "monospace",
  },
  agentInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 12,
  },
  agentAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f0f0f0",
  },
  agentDetails: {
    flex: 1,
  },
  agentName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  agentPhone: {
    fontSize: 14,
    color: "#666",
  },
  photosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  photoContainer: {
    width: "31%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  reasonText: {
    fontSize: 15,
    color: "#EF4444",
    lineHeight: 22,
    fontWeight: "500",
  },
});

export default MySOSDetailScreen;
