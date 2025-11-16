import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createSOSSchema, type CreateSOSSchema } from "@/schema/sosSchema";

interface SOSRequestModalProps {
  visible: boolean;
  onClose: () => void;
  rentalId: string;
  onSubmit: (data: CreateSOSSchema) => Promise<void>;
}

// Fixed coordinates for mobile emulator (example: Hanoi, Vietnam)
const FIXED_LATITUDE = 21.028511;
const FIXED_LONGITUDE = 105.804817;

export default function SOSRequestModal({
  visible,
  onClose,
  rentalId,
  onSubmit,
}: SOSRequestModalProps) {
  const insets = useSafeAreaInsets();
  const [issue, setIssue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ issue?: string }>({});

  const validateForm = () => {
    try {
      createSOSSchema.parse({
        latitude: FIXED_LATITUDE,
        longitude: FIXED_LONGITUDE,
        rental_id: rentalId,
        issue: issue.trim(),
      });
      setErrors({});
      return true;
    } catch (error: any) {
      const fieldErrors: { issue?: string } = {};
      if (error.errors) {
        error.errors.forEach((err: any) => {
          if (err.path[0] === "issue") {
            fieldErrors.issue = err.message;
          }
        });
      }
      setErrors(fieldErrors);
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        latitude: FIXED_LATITUDE,
        longitude: FIXED_LONGITUDE,
        rental_id: rentalId,
        issue: issue.trim(),
      });
      
      // Reset form
      setIssue("");
      setErrors({});
      onClose();
      
      Alert.alert(
        "Thành công",
        "Yêu cầu SOS đã được gửi. Đội ngũ cứu hộ sẽ liên hệ với bạn sớm nhất.",
        [{ text: "OK" }]
      );
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error?.message || "Không thể gửi yêu cầu SOS. Vui lòng thử lại."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    
    if (issue.trim()) {
      Alert.alert(
        "Xác nhận",
        "Bạn có chắc chắn muốn hủy? Thông tin đã nhập sẽ bị mất.",
        [
          { text: "Không", style: "cancel" },
          {
            text: "Có",
            onPress: () => {
              setIssue("");
              setErrors({});
              onClose();
            },
          },
        ]
      );
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={["#F44336", "#E57373"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.header, { paddingTop: insets.top + 16 }]}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <Ionicons name="warning" size={32} color="#fff" />
                <Text style={styles.headerTitle}>Yêu cầu SOS</Text>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
                disabled={isSubmitting}
              >
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.warningCard}>
              <Ionicons name="alert-circle" size={48} color="#F44336" />
              <Text style={styles.warningTitle}>Tình huống khẩn cấp</Text>
              <Text style={styles.warningText}>
                Vui lòng mô tả chi tiết vấn đề bạn đang gặp phải. Đội ngũ cứu hộ sẽ
                được thông báo ngay lập tức.
              </Text>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>
                Mô tả vấn đề <Text style={styles.required}>*</Text>
              </Text>
              <Text style={styles.subLabel}>
                Vui lòng mô tả chi tiết tình trạng xe hoặc vấn đề bạn gặp phải
              </Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.textArea, errors.issue && styles.inputError]}
                  placeholder="Ví dụ: Xe bị hỏng phanh, không thể di chuyển được..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={8}
                  textAlignVertical="top"
                  value={issue}
                  onChangeText={(text) => {
                    setIssue(text);
                    if (errors.issue) {
                      setErrors({});
                    }
                  }}
                  maxLength={1000}
                  editable={!isSubmitting}
                />
                <View style={styles.charCounter}>
                  <Text style={styles.charCountText}>{issue.length}/1000</Text>
                </View>
              </View>
              {errors.issue && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color="#F44336" />
                  <Text style={styles.errorText}>{errors.issue}</Text>
                </View>
              )}
            </View>

            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Ionicons name="location" size={20} color="#666" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Vị trí của bạn</Text>
                  <Text style={styles.infoValue}>
                    {FIXED_LATITUDE.toFixed(6)}, {FIXED_LONGITUDE.toFixed(6)}
                  </Text>
                  <Text style={styles.infoNote}>
                    Vị trí được xác định tự động
                  </Text>
                </View>
              </View>

              <View style={styles.infoDivider} />

              <View style={styles.infoRow}>
                <Ionicons name="bicycle" size={20} color="#666" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Mã thuê xe</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {rentalId}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.tipsSection}>
              <View style={styles.tipsHeader}>
                <Ionicons name="bulb" size={20} color="#FF9800" />
                <Text style={styles.tipsTitle}>Lưu ý quan trọng</Text>
              </View>
              <Text style={styles.tipsText}>
                • Hãy ở vị trí an toàn và chờ đội cứu hộ{"\n"}
                • Giữ điện thoại để đội cứu hộ có thể liên lạc{"\n"}
                • Không di chuyển xe nếu có vấn đề nghiêm trọng{"\n"}
                • Thời gian phản hồi trung bình: 15-30 phút
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.submitButton,
                isSubmitting && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>Gửi yêu cầu SOS</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    overflow: "hidden",
  },
  header: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  warningCard: {
    backgroundColor: "#FFEBEE",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#FFCDD2",
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F44336",
    marginTop: 12,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  formSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  subLabel: {
    fontSize: 13,
    color: "#999",
    marginBottom: 12,
  },
  required: {
    color: "#F44336",
  },
  inputContainer: {
    position: "relative",
  },
  textArea: {
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: "#333",
    minHeight: 150,
    backgroundColor: "#fafafa",
  },
  inputError: {
    borderColor: "#F44336",
  },
  charCounter: {
    position: "absolute",
    bottom: 8,
    right: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  charCountText: {
    fontSize: 11,
    color: "#999",
    fontWeight: "500",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  errorText: {
    fontSize: 13,
    color: "#F44336",
  },
  infoSection: {
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 15,
    color: "#333",
    fontWeight: "600",
  },
  infoNote: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
    fontStyle: "italic",
  },
  infoDivider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 12,
  },
  tipsSection: {
    backgroundColor: "#FFF9E6",
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FF9800",
  },
  tipsText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 22,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "700",
  },
  submitButton: {
    backgroundColor: "#F44336",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
