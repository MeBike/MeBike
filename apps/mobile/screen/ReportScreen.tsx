import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../providers/auth-providers";
import { useReportActions } from "../hooks/useReportActions";
import { getAccessToken } from "../utils/tokenManager";
import type { ReportScreenNavigationProp } from "../types/navigation";

// TomTom API
const TOMTOM_API_KEY =
  process.env.EXPO_PUBLIC_TOMTOM_API_KEY;

const fetchTomTomReverseGeocode = async (
  latitude: string,
  longitude: string
) => {
  try {
    const url = `https://api.tomtom.com/search/2/reverseGeocode/${latitude},${longitude}.JSON?key=${TOMTOM_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    return data?.addresses?.[0]?.address?.freeformAddress || "";
  } catch (e) {
    return "";
  }
};

const fetchTomTomAddressSuggest = async (addressText: string) => {
  try {
    const url = `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(addressText)}.JSON?key=${TOMTOM_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.results.map((r: any) => ({
      address: r.address.freeformAddress,
      latitude: r.position.lat,
      longitude: r.position.lon,
    }));
  } catch (e) {
    return [];
  }
};

type RouteParams = {
  bike_id?: string;
  station_id?: string;
  rental_id?: string;
};

function ReportScreen() {
  const navigation = useNavigation<ReportScreenNavigationProp>();
  const route = useRoute();
  const params = route.params as RouteParams | undefined;
  const { bike_id, station_id, rental_id } = params || {};
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const [page , setPage] = useState(1);
  const [limit] = useState(10);
  const { createReport, isCreatingReport } = useReportActions({ page, limit });

  const [reportType, setReportType] = useState("");
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState("");
  const [selectedImages, setSelectedImages] = useState<
    ImagePicker.ImagePickerAsset[]
  >([]);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null
  );



  // Lấy latitude/longitude từ địa chỉ nhập, rồi lấy lại địa chỉ từ coordinates
  const handleLocationChange = async (text: string) => {
    setLocation(text);
    if (typingTimeout) clearTimeout(typingTimeout);
    
    if (text.length > 3) {
      const timeout = setTimeout(async () => {
        try {
          // Lấy lat/lon từ địa chỉ nhập
          const sugg = await fetchTomTomAddressSuggest(text);
          setAddressSuggestions(sugg);
        } catch (error) {
          console.error("Error fetching address:", error);
        }
      }, 500);
      setTypingTimeout(timeout);
    } else {
      setAddressSuggestions([]);
      setCurrentLocation(null);
    }
  };

  const handleSelectSuggestion = async (item: any) => {
    setLocation(item.address);
    setAddressSuggestions([]);
    
    // Lấy địa chỉ chính xác từ lat/lon
    const address = await fetchTomTomReverseGeocode(
      item.latitude.toString(),
      item.longitude.toString()
    );
    
    // Cập nhật location với địa chỉ chính xác
    if (address) {
      setLocation(address);
    }
    
    // Lưu coordinates
    setCurrentLocation({
      latitude: item.latitude,
      longitude: item.longitude,
    });
  };

  const reportTypes = [
    { value: "XE HƯ HỎNG", label: "Xe bị hỏng" },
    { value: "XE BẨN", label: "Xe bẩn" },
    { value: "TRẠM ĐẦY", label: "Trạm đầy" },
    { value: "TRẠM KHÔNG NHẬN XE", label: "Trạm không nhận xe" },
    { value: "KHÁC", label: "Khác" },
  ];

  const handleSubmit = async () => {
    if (!reportType) {
      Alert.alert("Lỗi", "Vui lòng chọn loại báo cáo");
      return;
    }
    if (!message.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập mô tả vấn đề");
      return;
    }
    const reportData = {
      bike_id: bike_id || undefined,
      station_id: station_id || undefined,
      rental_id: rental_id || undefined,
      location: location.trim() || undefined,
      type: reportType,
      message: message.trim(),
      media_urls: selectedImages.length > 0 ? selectedImages : undefined,
      ...(currentLocation && {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      }),
    };
    createReport(reportData, {
      onSuccess: () => {
        Alert.alert("Thành công", "Báo cáo đã được gửi thành công", [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]);
      },
      onError: (error) => {
        console.error("Report creation error:", error);
        Alert.alert("Lỗi", "Không thể gửi báo cáo. Vui lòng thử lại.");
      },
    });
  };

  const handleAddImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
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

  if (!isAuthenticated) {
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
          <Text style={styles.headerTitle}>Báo cáo sự cố</Text>
        </LinearGradient>
        <View style={styles.authRequiredContainer}>
          <Ionicons name="log-in-outline" size={64} color="#ccc" />
          <Text style={styles.authRequiredText}>
            Vui lòng đăng nhập để báo cáo
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.loginButtonText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
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
        <Text style={styles.headerTitle}>Báo cáo sự cố</Text>
      </LinearGradient>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {(bike_id || station_id || rental_id) && (
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="information-circle" size={24} color="#0066FF" />
              <Text style={styles.cardTitle}>Thông tin liên quan</Text>
            </View>
            {bike_id && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mã xe:</Text>
                <Text style={styles.infoValue}>{bike_id}</Text>
              </View>
            )}
            {station_id && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mã trạm:</Text>
                <Text style={styles.infoValue}>{station_id}</Text>
              </View>
            )}
            {rental_id && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mã thuê:</Text>
                <Text style={styles.infoValue}>{rental_id}</Text>
              </View>
            )}
          </View>
        )}

        {/* Report Type */}
        <View style={styles.formCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="list" size={24} color="#0066FF" />
            <Text style={styles.cardTitle}>Loại báo cáo</Text>
          </View>
          <View style={styles.typeOptions}>
            {reportTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.typeOption,
                  reportType === type.value && styles.typeOptionSelected,
                ]}
                onPress={() => setReportType(type.value)}
              >
                <Text
                  style={[
                    styles.typeOptionText,
                    reportType === type.value && styles.typeOptionTextSelected,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Message */}
        <View style={styles.formCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text" size={24} color="#0066FF" />
            <Text style={styles.cardTitle}>Mô tả vấn đề</Text>
          </View>
          <TextInput
            style={styles.messageInput}
            placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
            multiline
            value={message}
            onChangeText={setMessage}
            maxLength={500}
          />
          <Text style={styles.charCount}>{message.length}/500</Text>
        </View>

        {/* Location */}
        <View style={styles.formCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="location" size={24} color="#0066FF" />
            <Text style={styles.cardTitle}>Vị trí (tùy chọn)</Text>
          </View>
          <TextInput
            style={styles.locationInput}
            placeholder="Nhập địa chỉ"
            value={location}
            onChangeText={handleLocationChange}
          />
          {addressSuggestions.length > 0 && (
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 8,
                marginTop: 8,
                maxHeight: 180,
                borderColor: "#d0d7de",
                borderWidth: 1,
                overflow: "hidden",
              }}
            >
              {addressSuggestions.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={{
                    padding: 10,
                    borderBottomColor: idx === addressSuggestions.length - 1 ? "transparent" : "#eee",
                    borderBottomWidth: idx === addressSuggestions.length - 1 ? 0 : 1,
                  }}
                  onPress={() => handleSelectSuggestion(item)}
                >
                  <Text style={{ color: "#0066FF" }}>{item.address}</Text>
                  <Text style={{ fontSize: 12, color: "#888" }}>
                    ({item.latitude}, {item.longitude})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Images */}
        <View style={styles.formCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="images" size={24} color="#0066FF" />
            <Text style={styles.cardTitle}>Hình ảnh (tùy chọn)</Text>
          </View>
          <TouchableOpacity
            style={styles.addImageButton}
            onPress={handleAddImage}
          >
            <Ionicons name="add" size={24} color="#0066FF" />
            <Text style={styles.addImageText}>Thêm hình ảnh</Text>
          </TouchableOpacity>
          {selectedImages.length > 0 && (
            <View style={styles.selectedImageList}>
              {selectedImages.map((image, index) => (
                <View key={index} style={styles.selectedImageItem}>
                  <Image
                    source={{ uri: image.uri }}
                    style={styles.imagePreview}
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={20} color="#F44336" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isCreatingReport && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={isCreatingReport}
        >
          {isCreatingReport ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Gửi báo cáo</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
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
  infoCard: {
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
  formCard: {
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    textAlign: "right",
    flex: 1,
    marginLeft: 16,
  },
  typeOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d0d7de",
    backgroundColor: "#fff",
  },
  typeOptionSelected: {
    backgroundColor: "#0066FF",
    borderColor: "#0066FF",
  },
  typeOptionText: {
    fontSize: 14,
    color: "#333",
  },
  typeOptionTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  messageInput: {
    borderWidth: 1,
    borderColor: "#d0d7de",
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    textAlignVertical: "top",
    fontSize: 14,
    color: "#333",
  },
  charCount: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
    marginTop: 4,
  },
  locationInput: {
    borderWidth: 1,
    borderColor: "#d0d7de",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#333",
  },
  addImageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#0066FF",
    borderRadius: 8,
    borderStyle: "dashed",
  },
  addImageText: {
    fontSize: 14,
    color: "#0066FF",
    marginLeft: 8,
  },
  selectedImageList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  },
  selectedImageItem: {
    position: "relative",
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
  },
  // imagePreview: {
  //   width: "100%",
  //   height: "100%",
  //   borderRadius: 8,
  // },
  // removeImageButton: {
  //   position: "absolute",
  //   top: -8,
  //   right: -8,
  //   backgroundColor: "#fff",
  //   borderRadius: 12,
  //   padding: 2,
  // },
  submitButton: {
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
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  bookingSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  bookingSelectorText: {
    fontSize: 14,
    color: "#666",
  },
  selectedBookingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  selectedBookingSubtext: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalBackButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  bookingList: {
    padding: 16,
  },
  bookingItem: {
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
  bookingItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  bookingItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  bookingItemDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  bookingItemPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0066FF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
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
  imageList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  },
  imageItem: {
    position: "relative",
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 2,
  },
  authRequiredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  authRequiredText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 24,
    textAlign: "center",
  },
  loginButton: {
    backgroundColor: "#0066FF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  locationInfo: {
    backgroundColor: "#f0f8ff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#0066FF",
  },
  locationText: {
    fontSize: 14,
    color: "#0066FF",
    fontWeight: "500",
    marginBottom: 4,
  },
  locationNote: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
});

// giữ nguyên phần styles phía dưới...

export default ReportScreen;
