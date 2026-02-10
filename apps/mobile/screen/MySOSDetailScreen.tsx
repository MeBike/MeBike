import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSOS } from "@hooks/use-sos";
import { useAuthNext } from "@providers/auth-provider-next";
import type { SOSDetail } from "@/types/SOS";
import { formatVietnamDateTime } from "@/utils/date";
type RouteParams = {
  sosId: string;
};

const MySOSDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { sosId } = route.params as RouteParams;
  const { isAuthenticated } = useAuthNext();
  const hasToken = isAuthenticated;
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { sosDetail, isLoadingSOSDetail, refetchSOSDetail, cancelSOSRequest } = useSOS({
    hasToken,
    page: 1,
    limit: 10,
    id: sosId,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchSOSDetail();
    setRefreshing(false);
  };

  useEffect(() => {
    if (sosId) {
      refetchSOSDetail();
    }
  }, [sosId]);

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

  const handleCancelSOS = async () => {
    if (!cancelReason.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập lý do hủy");
      return;
    }

    setIsCancelling(true);
    try {
      await cancelSOSRequest({ reason: cancelReason });
      setShowCancelModal(false);
      setCancelReason("");
      await refetchSOSDetail();
      Alert.alert("Thành công", "Đã hủy yêu cầu SOS thành công", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể hủy yêu cầu SOS");
    } finally {
      setIsCancelling(false);
    }
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
                Tạo lúc: {formatVietnamDateTime(detail.created_at)}
              </Text>
            </View>
            {detail.resolved_at && (
              <View style={styles.timelineItem}>
                <Ionicons
                  name="checkmark-done-outline"
                  size={16}
                  color="#666"
                />
                <Text style={styles.timelineText}>
                  Xử lý lúc: {formatVietnamDateTime(detail.resolved_at)}
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
            <Text style={styles.infoValue}>
              #{detail._id.slice(-8).toUpperCase()}
            </Text>
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
                {formatVietnamDateTime(detail.rental.start_time)}
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
                    detail.sos_agent.avatar || "https://via.placeholder.com/60",
                }}
                style={styles.agentAvatar}
              />
              <View style={styles.agentDetails}>
                <Text style={styles.agentName}>
                  {detail.sos_agent.fullname}
                </Text>
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
              <Text style={styles.cardTitle}>
                Hình ảnh ({detail.photos.length})
              </Text>
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

        {/* Cancel Button - only show if status is ĐANG CHỜ XỬ LÍ */}
        {detail.status === "ĐANG CHỜ XỬ LÍ" && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowCancelModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={24} color="#fff" />
            <Text style={styles.cancelButtonText}>Hủy yêu cầu SOS</Text>
          </TouchableOpacity>
        )}

        {/* Spacer to ensure scrollable content */}
        <View style={{ height: 50 }} />
      </ScrollView>

      {/* Cancel Modal */}
      <Modal
        visible={showCancelModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Hủy yêu cầu SOS</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                }}
                disabled={isCancelling}
              >
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Lý do hủy:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nhập lý do hủy yêu cầu SOS..."
              placeholderTextColor="#999"
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!isCancelling}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                }}
                disabled={isCancelling}
              >
                <Text style={styles.modalButtonSecondaryText}>Đóng</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDanger]}
                onPress={handleCancelSOS}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalButtonDangerText}>Xác nhận hủy</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  cancelButton: {
    backgroundColor: "#EF4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  modalLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: "#1a1a1a",
    minHeight: 100,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonSecondary: {
    backgroundColor: "#f0f0f0",
  },
  modalButtonSecondaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  modalButtonDanger: {
    backgroundColor: "#EF4444",
  },
  modalButtonDangerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});

export default MySOSDetailScreen;
