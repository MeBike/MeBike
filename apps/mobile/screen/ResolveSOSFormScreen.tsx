import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import type { ImagePickerAsset } from "expo-image-picker";
import { useSOS } from "@/hooks/use-sos";
import { resolveSOSSchema, type ResolveSOSSchema } from "@/schema/sosSchema";
import { uploadMultipleImagesToFirebase } from "@/lib/imageUpload";

type RouteParams = {
  sosId: string;
  solvable: boolean;
};

export default function ResolveSOSFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { sosId, solvable } = route.params as RouteParams;
  const [agentNotes, setAgentNotes] = useState("");
  const [selectedImages, setSelectedImages] = useState<ImagePickerAsset[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { resolveSOSRequest } = useSOS({
    hasToken: true,
    page: 1,
    limit: 10,
    id: sosId,
  });

  const handleAddImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Quyền truy cập bị từ chối",
          "Cần quyền truy cập thư viện ảnh để chọn hình ảnh"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 5,
      });

      if (!result.canceled && result.assets) {
        setSelectedImages((prev) => [...prev, ...result.assets]);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Lỗi", "Không thể chọn hình ảnh. Vui lòng thử lại.");
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!solvable && !agentNotes.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập lý do không xử lý được");
      return;
    }

    if (selectedImages.length === 0) {
      Alert.alert("Lỗi", "Vui lòng chọn ít nhất 1 ảnh");
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload images to Firebase first
      const photoUrls = await uploadMultipleImagesToFirebase(selectedImages);

      const data: ResolveSOSSchema = {
        solvable,
        agent_notes: agentNotes.trim() || undefined,
        photos: photoUrls,
      };

      const validatedData = resolveSOSSchema.parse(data);
      await resolveSOSRequest(validatedData);

      Alert.alert(
        "Thành công",
        solvable ? "Đã xử lý xong yêu cầu" : "Đã đánh dấu không xử lý được",
        [
          {
            text: "OK",
            onPress: () => {
              navigation.goBack();
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Lỗi", error.message);
      } else {
        Alert.alert("Lỗi", "Không thể cập nhật trạng thái");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const gradientColors = solvable
    ? ["#4CAF50", "#66BB6A"] as const
    : ["#F44336", "#E57373"] as const;
  const bgColor = solvable ? "#E8F5E9" : "#FFEBEE";
  const textColor = solvable ? "#2E7D32" : "#C62828";
  const title = solvable ? "Xác nhận đã xử lý" : "Không xử lý được";
  const placeholder = solvable
    ? "Nhập ghi chú về việc xử lý (không bắt buộc)..."
    : "Nhập lý do không xử lý được...";

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={solvable ? "#4CAF50" : "#F44336"}
      />
      <LinearGradient
        colors={gradientColors}
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
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.headerPlaceholder} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, { backgroundColor: bgColor }]}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={solvable ? "checkmark-circle" : "close-circle"}
              size={64}
              color={textColor}
            />
          </View>
          <Text style={[styles.cardTitle, { color: textColor }]}>{title}</Text>
          <Text style={styles.cardSubtitle}>
            {solvable
              ? "Vui lòng xác nhận bạn đã xử lý xong yêu cầu SOS này"
              : "Vui lòng cho biết lý do không thể xử lý yêu cầu này"}
          </Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formLabel}>
            {solvable ? "Ghi chú" : "Lý do"}{" "}
            {!solvable && <Text style={styles.required}>*</Text>}
          </Text>
          <TextInput
            style={styles.textArea}
            placeholder={placeholder}
            placeholderTextColor="#999"
            value={agentNotes}
            onChangeText={setAgentNotes}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            editable={!isSubmitting}
          />
          <Text style={styles.charCount}>
            {agentNotes.length}/500 ký tự
          </Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.labelRow}>
            <Text style={styles.formLabel}>
              Ảnh bằng chứng <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.addImageButton}
              onPress={handleAddImage}
              disabled={isSubmitting || selectedImages.length >= 5}
              activeOpacity={0.7}
            >
              <Ionicons name="camera" size={20} color="#fff" />
              <Text style={styles.addImageText}>Thêm ảnh</Text>
            </TouchableOpacity>
          </View>

          {selectedImages.length === 0 ? (
            <View style={styles.emptyImageContainer}>
              <Ionicons name="images-outline" size={48} color="#ccc" />
              <Text style={styles.emptyImageText}>
                Chưa có ảnh nào được chọn
              </Text>
              <Text style={styles.emptyImageSubtext}>
                Cần ít nhất 1 ảnh (tối đa 5 ảnh)
              </Text>
            </View>
          ) : (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.imageScrollView}
              >
                {selectedImages.map((image, index) => (
                  <View key={index} style={styles.imageContainer}>
                    <Image
                      source={{ uri: image.uri }}
                      style={styles.imagePreview}
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                      disabled={isSubmitting}
                    >
                      <Ionicons name="close-circle" size={24} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
              <Text style={styles.imageCount}>
                {selectedImages.length}/5 ảnh
              </Text>
            </>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => navigation.goBack()}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={22} color="#666" />
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.submitButton,
              { backgroundColor: solvable ? "#4CAF50" : "#F44336" },
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons
                  name={solvable ? "checkmark-done" : "alert-circle"}
                  size={22}
                  color="#fff"
                />
                <Text style={styles.submitButtonText}>Xác nhận</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    justifyContent: "space-between",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  headerPlaceholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
  },
  iconContainer: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  formCard: {
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
  formLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  required: {
    color: "#F44336",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: "#333",
    minHeight: 120,
    backgroundColor: "#fafafa",
  },
  charCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
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
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#666",
  },
  submitButton: {
    // backgroundColor will be set dynamically
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  addImageButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2196F3",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  addImageText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyImageContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "#fafafa",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
  },
  emptyImageText: {
    fontSize: 14,
    color: "#999",
    marginTop: 12,
    fontWeight: "500",
  },
  emptyImageSubtext: {
    fontSize: 12,
    color: "#bbb",
    marginTop: 4,
  },
  imageScrollView: {
    marginBottom: 8,
  },
  imageContainer: {
    position: "relative",
    marginRight: 12,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  imageCount: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
    marginTop: 4,
  },
});
