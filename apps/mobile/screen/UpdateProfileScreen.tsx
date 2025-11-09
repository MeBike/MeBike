import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

import { useAuth } from "@providers/auth-providers";
import { uploadImageToFirebase } from "@lib/imageUpload";

// TomTom API
const TOMTOM_API_KEY = process.env.EXPO_PUBLIC_TOMTOM_API_KEY;

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

function UpdateProfileScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, updateProfile, isUpdatingProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [fullname, setFullname] = useState(user?.fullname || "");
  const [username, setUsername] = useState(user?.username || "");
  const [phone, setPhone] = useState(user?.phone_number || "");
  const [location, setLocation] = useState(user?.location || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleEditPress = () => {
    setIsEditing(true);
  };

  const handleLocationChange = async (text: string) => {
    setLocation(text);
    if (typingTimeout) clearTimeout(typingTimeout);
    
    if (text.length > 3) {
      const timeout = setTimeout(async () => {
        try {
          const sugg = await fetchTomTomAddressSuggest(text);
          setAddressSuggestions(sugg);
        } catch (error) {
          console.error("Error fetching address:", error);
        }
      }, 500);
      setTypingTimeout(timeout);
    } else {
      setAddressSuggestions([]);
    }
  };

  const handleSelectSuggestion = async (item: any) => {
    setLocation(item.address);
    setAddressSuggestions([]);
    
    const address = await fetchTomTomReverseGeocode(
      item.latitude.toString(),
      item.longitude.toString()
    );
    
    if (address) {
      setLocation(address);
    }
  };

  const handlePickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploadingAvatar(true);
        const uploadedUrl = await uploadImageToFirebase(result.assets[0]);
        setAvatar(uploadedUrl);
        setIsUploadingAvatar(false);
        Alert.alert("Thành công", "Ảnh đã được upload!");
      }
    }
    catch (error) {
      setIsUploadingAvatar(false);
      Alert.alert("Lỗi", "Upload ảnh thất bại. Vui lòng thử lại.");
      console.log("Upload error:", error);
    }
  };

  const handleSave = async () => {
    if (!fullname.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập họ tên");
      return;
    }
    if (!phone.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập số điện thoại");
      return;
    }

    const changedData: any = {};
    if (fullname !== (user?.fullname || "")) changedData.fullname = fullname;
    if (username !== (user?.username || "")) changedData.username = username;
    if (phone !== (user?.phone_number || "")) changedData.phone_number = phone;
    if (location !== (user?.location || "")) changedData.locatin = location;
    if (avatar !== (user?.avatar || "")) changedData.avatar = avatar;

    if (Object.keys(changedData).length === 0) {
      Alert.alert("Không có thay đổi", "Bạn chưa thay đổi thông tin nào.");
      setIsEditing(false);
      return;
    }

    try {
      await updateProfile(changedData);
      setIsEditing(false);
      Alert.alert("Thành công", "Cập nhật thông tin thành công!");
    }
    catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Cập nhật thất bại. Vui lòng thử lại.";
      Alert.alert("Lỗi", errorMsg);
    }
  };

  const handleCancel = () => {
    setFullname(user?.fullname || "");
    setUsername(user?.username || "");
    setPhone(user?.phone_number || "");
    setLocation(user?.location || "");
    setAvatar(user?.avatar || "");
    setIsEditing(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />

      <LinearGradient
        colors={["#0066FF", "#00B4D8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cập nhật thông tin</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.avatarSection}>
          <Image
            source={{
              uri: avatar || "https://via.placeholder.com/100",
            }}
            style={styles.avatar}
          />
          {isEditing && (
            <TouchableOpacity 
              style={styles.cameraButton}
              onPress={handlePickAvatar}
              disabled={isUploadingAvatar}
            >
              {isUploadingAvatar ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        <View style={styles.formSection}>
          {/* Fullname */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Họ và tên</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="person"
                size={18}
                color="#0066FF"
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                placeholder="Nhập họ và tên"
                placeholderTextColor="#ccc"
                value={fullname}
                onChangeText={setFullname}
                editable={isEditing}
              />
            </View>
          </View>

          {/* Username */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Username</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="person"
                size={18}
                color="#0066FF"
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                placeholder="Nhập username"
                placeholderTextColor="#ccc"
                value={username}
                onChangeText={setUsername}
                editable={isEditing}
              />
            </View>
          </View>

          {/* Email (read-only) */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="mail"
                size={18}
                color="#0066FF"
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                placeholder="Email"
                placeholderTextColor="#ccc"
                value={user?.email || ""}
                editable={false}
              />
            </View>
          </View>

          {/* Phone Number */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Điện thoại</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="call"
                size={18}
                color="#0066FF"
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                placeholder="Nhập số điện thoại"
                placeholderTextColor="#ccc"
                value={phone}
                onChangeText={setPhone}
                editable={isEditing}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Location */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Địa chỉ</Text>
            <View>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="location"
                  size={18}
                  color="#0066FF"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, !isEditing && styles.inputDisabled]}
                  placeholder="Nhập địa chỉ"
                  placeholderTextColor="#ccc"
                  value={location}
                  onChangeText={handleLocationChange}
                  editable={isEditing}
                />
              </View>
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
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {!isEditing
            ? (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={handleEditPress}
                >
                  <Ionicons name="pencil" size={18} color="#fff" />
                  <Text style={styles.buttonText}>Chỉnh sửa thông tin</Text>
                </TouchableOpacity>
              )
            : (
                <>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                    disabled={isUpdatingProfile}
                  >
                    <Ionicons name="checkmark" size={18} color="#fff" />
                    <Text style={styles.buttonText}>
                      {isUpdatingProfile ? "Đang lưu..." : "Lưu thay đổi"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancel}
                    disabled={isUpdatingProfile}
                  >
                    <Ionicons name="close" size={18} color="#0066FF" />
                    <Text style={styles.cancelButtonText}>Hủy</Text>
                  </TouchableOpacity>
                </>
              )}
        </View>
        <Text style={styles.infoText}>
          Cập nhật thông tin cá nhân của bạn để có trải nghiệm tốt hơn
        </Text>
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
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "#fff",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: "35%",
    backgroundColor: "#FF6B6B",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formSection: {
    marginBottom: 24,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#333",
    paddingVertical: 12,
  },
  inputDisabled: {
    color: "#666",
  },
  buttonContainer: {
    marginBottom: 20,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0066FF",
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00B050",
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#0066FF",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  cancelButtonText: {
    color: "#0066FF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  infoText: {
    textAlign: "center",
    fontSize: 12,
    color: "#999",
    marginBottom: 20,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 4,
  },
});

export default UpdateProfileScreen;
