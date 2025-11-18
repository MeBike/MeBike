import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as Location from "expo-location";
import { createSOSSchema } from "@/schema/sosSchema";
import type { CreateSOSSchema } from "@/schema/sosSchema";
import { useSOS } from "@hooks/use-sos";
import { useAuth } from "@providers/auth-providers";

type RouteParams = {
  rentalId: string;
};

const CreateSOSRequestScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { rentalId } = route.params as RouteParams;
  const { user } = useAuth();
  const hasToken = Boolean(user?._id);
  const { createSOSRequest } = useSOS({ hasToken, page: 1, limit: 10 });

  const [issue, setIssue] = useState("");
  const [errors, setErrors] = useState<{ issue?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoadingLocation(true);
        setLocationError(null);

        // Request permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocationError("Quyền truy cập vị trí bị từ chối");
          setLoadingLocation(false);
          return;
        }

        // Get current location
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
      } catch (error) {
        console.error("Error getting location:", error);
        setLocationError("Không thể lấy vị trí hiện tại");
      } finally {
        setLoadingLocation(false);
      }
    })();
  }, []);

  const validateForm = (): boolean => {
    if (!location) {
      Alert.alert("Lỗi", "Chưa có thông tin vị trí");
      return false;
    }
    try {
      createSOSSchema.parse({
        latitude: location.latitude,
        longitude: location.longitude,
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
    if (!location) {
      Alert.alert("Lỗi", "Chưa có thông tin vị trí. Vui lòng thử lại.");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const data: CreateSOSSchema = {
        latitude: location.latitude,
        longitude: location.longitude,
        rental_id: rentalId,
        issue: issue.trim(),
      };

      await createSOSRequest(data);
      
      // Navigate back after successful creation
      Alert.alert(
        "Thành công",
        "Yêu cầu cứu hộ đã được gửi. Đội cứu hộ sẽ đến sớm nhất có thể.",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      const errorMessage = error?.message || "Không thể gửi yêu cầu cứu hộ. Vui lòng thử lại.";
      Alert.alert("Lỗi", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <LinearGradient
        colors={["#FF3B30", "#FF6B6B"]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Ionicons name="alert-circle" size={32} color="#fff" />
            <Text style={styles.headerTitle}>Yêu cầu cứu hộ khẩn cấp</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Location Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="location" size={24} color="#FF3B30" />
            <Text style={styles.cardTitle}>Vị trí hiện tại</Text>
          </View>
          {loadingLocation ? (
            <View style={styles.loadingLocation}>
              <ActivityIndicator size="small" color="#FF3B30" />
              <Text style={styles.loadingLocationText}>Đang lấy vị trí...</Text>
            </View>
          ) : locationError ? (
            <View style={styles.locationErrorBox}>
              <Ionicons name="warning" size={20} color="#FF3B30" />
              <Text style={styles.locationErrorText}>{locationError}</Text>
            </View>
          ) : location ? (
            <>
              <View style={styles.locationInfo}>
                <View style={styles.locationRow}>
                  <Text style={styles.locationLabel}>Vĩ độ:</Text>
                  <Text style={styles.locationValue}>
                    {location.latitude.toFixed(6)}
                  </Text>
                </View>
                <View style={styles.locationRow}>
                  <Text style={styles.locationLabel}>Kinh độ:</Text>
                  <Text style={styles.locationValue}>
                    {location.longitude.toFixed(6)}
                  </Text>
                </View>
              </View>
              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={16} color="#666" />
                <Text style={styles.infoText}>
                  Vị trí của bạn sẽ được gửi đến đội cứu hộ
                </Text>
              </View>
            </>
          ) : null}
        </View>

        {/* Issue Description Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="create" size={24} color="#FF3B30" />
            <Text style={styles.cardTitle}>Mô tả vấn đề</Text>
          </View>
          
          <TextInput
            style={[
              styles.issueInput,
              errors.issue && styles.issueInputError,
            ]}
            placeholder="Mô tả chi tiết vấn đề bạn đang gặp phải (5-1000 ký tự)..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            value={issue}
            onChangeText={(text) => {
              setIssue(text);
              if (errors.issue) {
                setErrors({ ...errors, issue: undefined });
              }
            }}
            maxLength={1000}
          />
          
          <View style={styles.characterCount}>
            <Text
              style={[
                styles.characterCountText,
                issue.length > 1000 && styles.characterCountError,
              ]}
            >
              {issue.length}/1000
            </Text>
          </View>

          {errors.issue && (
            <View style={styles.errorContainer}>
              <Ionicons name="warning" size={16} color="#FF3B30" />
              <Text style={styles.errorText}>{errors.issue}</Text>
            </View>
          )}
        </View>

        {/* Tips Card */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb" size={20} color="#FF9500" />
            <Text style={styles.tipsTitle}>Lưu ý khi yêu cầu cứu hộ</Text>
          </View>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>
                Hãy ở vị trí an toàn và chờ đội cứu hộ đến
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>
                Mô tả rõ ràng vấn đề để được hỗ trợ nhanh hơn
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>
                Đội cứu hộ sẽ liên hệ qua số điện thoại của bạn
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={isSubmitting}
        >
          <Text style={styles.cancelButtonText}>Hủy</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, (isSubmitting || !location) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting || !location}
        >
          <LinearGradient
            colors={isSubmitting ? ["#999", "#999"] : ["#FF3B30", "#FF6B6B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitButtonGradient}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Gửi yêu cầu</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
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
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginLeft: 12,
  },
  locationInfo: {
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  locationLabel: {
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  },
  locationValue: {
    fontSize: 15,
    color: "#1a1a1a",
    fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  loadingLocation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 12,
  },
  loadingLocationText: {
    fontSize: 15,
    color: "#666",
  },
  locationErrorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  locationErrorText: {
    fontSize: 14,
    color: "#FF3B30",
    flex: 1,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 8,
    flex: 1,
  },
  issueInput: {
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1a1a1a",
    minHeight: 150,
    borderWidth: 2,
    borderColor: "transparent",
  },
  issueInputError: {
    borderColor: "#FF3B30",
    backgroundColor: "#FFF5F5",
  },
  characterCount: {
    alignItems: "flex-end",
    marginTop: 8,
  },
  characterCountText: {
    fontSize: 14,
    color: "#999",
    fontWeight: "500",
  },
  characterCountError: {
    color: "#FF3B30",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    backgroundColor: "#FFF5F5",
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    color: "#FF3B30",
    marginLeft: 8,
    flex: 1,
  },
  tipsCard: {
    backgroundColor: "#FFF9E6",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#FFE5B4",
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginLeft: 8,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  tipBullet: {
    fontSize: 20,
    color: "#FF9500",
    marginRight: 12,
    lineHeight: 22,
  },
  tipText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
    lineHeight: 22,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#666",
  },
  submitButton: {
    flex: 2,
    borderRadius: 12,
    overflow: "hidden",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});

export default CreateSOSRequestScreen;
