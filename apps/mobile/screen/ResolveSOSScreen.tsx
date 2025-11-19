import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { resolveSOSSchema } from "@/schema/sosSchema";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "@/types/navigation";
import * as ImagePicker from "expo-image-picker";
import { uploadMultipleImagesToFirebase } from "@/lib/imageUpload";
import type { ImagePickerAsset } from "expo-image-picker";

type ResolveSOSScreenRouteProp = RouteProp<RootStackParamList, "ResolveSOSScreen">;

export default function ResolveSOSScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<ResolveSOSScreenRouteProp>();
  const { sosId, solvable, onSubmit } = route.params;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agentNotes, setAgentNotes] = useState("");
  const [errors, setErrors] = useState<{ agent_notes?: string }>({});
  const [selectedImages, setSelectedImages] = useState<ImagePickerAsset[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const validateForm = () => {
    try {
      resolveSOSSchema.parse({
        solvable,
        agent_notes: agentNotes,
        photos: [],
      });
      setErrors({});
      return true;
    } catch (error: any) {
      const fieldErrors: { agent_notes?: string } = {};
      if (error.errors) {
        error.errors.forEach((err: any) => {
          if (err.path[0] === "agent_notes") {
            fieldErrors.agent_notes = err.message;
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
      
      // Upload images to Firebase first
      let photoUrls: string[] = [];
      if (selectedImages.length > 0) {
        setIsUploadingImages(true);
        try {
          photoUrls = await uploadMultipleImagesToFirebase(selectedImages);
        } catch (error) {
          Alert.alert("Lỗi", "Không thể tải ảnh lên. Vui lòng thử lại.");
          setIsUploadingImages(false);
          setIsSubmitting(false);
          return;
        }
        setIsUploadingImages(false);
      }

      await onSubmit({
        solvable,
        agent_notes: agentNotes,
        photos: photoUrls,
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert("Lỗi", "Có lỗi xảy ra khi xử lý yêu cầu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc chắn muốn hủy?",
      [
        { text: "Không", style: "cancel" },
        { text: "Có", onPress: () => navigation.goBack() },
      ]
    );
  };

  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert(
          "Quyền truy cập",
          "Cần quyền truy cập thư viện ảnh để chọn ảnh"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 5,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets;
        const totalImages = selectedImages.length + newImages.length;
        
        if (totalImages > 5) {
          Alert.alert("Thông báo", "Chỉ có thể chọn tối đa 5 ảnh");
          return;
        }
        
        setSelectedImages([...selectedImages, ...newImages]);
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể chọn ảnh");
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
      <LinearGradient
        colors={solvable ? ["#4CAF50", "#66BB6A"] : ["#F44336", "#EF5350"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Ionicons 
              name={solvable ? "checkmark-circle" : "close-circle"} 
              size={32} 
              color="#fff" 
            />
            <Text style={styles.headerTitle}>
              {solvable ? "Xác nhận đã xử lý" : "Báo cáo không xử lý được"}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons 
              name={solvable ? "information-circle" : "alert-circle"} 
              size={24} 
              color={solvable ? "#4CAF50" : "#F44336"} 
            />
            <Text style={styles.infoText}>
              {solvable 
                ? "Vui lòng cung cấp ghi chú về cách bạn đã xử lý yêu cầu SOS này."
                : "Vui lòng giải thích lý do tại sao không thể xử lý yêu cầu SOS này."}
            </Text>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>
            Ghi chú chi tiết <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.textArea,
                errors.agent_notes && styles.inputError,
              ]}
              placeholder={
                solvable
                  ? "Ví dụ: Đã thay thế xe mới và hướng dẫn khách hàng..."
                  : "Ví dụ: Khách hàng không ở vị trí đã báo..."
              }
              placeholderTextColor="#999"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={agentNotes}
              onChangeText={(text) => {
                setAgentNotes(text);
                if (errors.agent_notes) {
                  setErrors({});
                }
              }}
              maxLength={500}
            />
            <View style={styles.charCounter}>
              <Text style={styles.charCountText}>
                {agentNotes.length}/500
              </Text>
            </View>
          </View>
          {errors.agent_notes && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#F44336" />
              <Text style={styles.errorText}>{errors.agent_notes}</Text>
            </View>
          )}
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Ảnh minh chứng (Tùy chọn)</Text>
          <Text style={styles.subLabel}>Tối đa 5 ảnh</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
            <TouchableOpacity
              style={styles.addImageButton}
              onPress={pickImages}
              disabled={selectedImages.length >= 5}
            >
              <Ionicons name="camera" size={32} color={selectedImages.length >= 5 ? "#ccc" : "#0066FF"} />
              <Text style={[styles.addImageText, selectedImages.length >= 5 && styles.addImageTextDisabled]}>
                Thêm ảnh
              </Text>
            </TouchableOpacity>

            {selectedImages.map((image, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#F44336" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.noteSection}>
          <View style={styles.noteHeader}>
            <Ionicons name="bulb-outline" size={20} color="#FF9800" />
            <Text style={styles.noteTitle}>Lưu ý</Text>
          </View>
          <Text style={styles.noteText}>
            • Cung cấp thông tin chi tiết và chính xác{"\n"}
            • Ghi chú sẽ được lưu lại để tham khảo sau này{"\n"}
            • Thông tin này có thể được chia sẻ với khách hàng
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancel}
            activeOpacity={0.8}
            disabled={isSubmitting}
          >
            <Ionicons name="close-circle-outline" size={22} color="#666" />
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              solvable ? styles.submitButtonSuccess : styles.submitButtonDanger,
              isSubmitting && styles.buttonDisabled,
            ]}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons 
                  name={solvable ? "checkmark-done" : "close-circle"} 
                  size={22} 
                  color="#fff" 
                />
                <Text style={styles.submitButtonText}>
                  {isUploadingImages 
                    ? "Đang tải ảnh..." 
                    : solvable ? "Xác nhận đã xử lý" : "Xác nhận không xử lý được"}
                </Text>
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
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  formSection: {
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
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
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
    minHeight: 120,
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
  imageScroll: {
    marginTop: 8,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
    marginRight: 12,
  },
  addImageText: {
    fontSize: 12,
    color: "#0066FF",
    marginTop: 4,
    fontWeight: "600",
  },
  addImageTextDisabled: {
    color: "#ccc",
  },
  imageContainer: {
    position: "relative",
    marginRight: 12,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
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
  noteSection: {
    backgroundColor: "#FFF9E6",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
  },
  noteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FF9800",
  },
  noteText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 20,
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
    backgroundColor: "#f5f5f5",
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "700",
  },
  submitButtonSuccess: {
    backgroundColor: "#4CAF50",
  },
  submitButtonDanger: {
    backgroundColor: "#F44336",
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
