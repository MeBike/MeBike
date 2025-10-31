import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { DetailUser } from "@services/auth.service";

import { useAuth } from "@providers/auth-providers";
import { getRefreshToken } from "@utils/tokenManager";

function ProfileScreen() {
  const navigation = useNavigation();
  const { user, logOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [profile] = useState<DetailUser>(() => ({
    _id: user?._id ?? "",
    fullname: user?.fullname ?? "",
    email: user?.email ?? "",
    verify: user?.verify ?? "",
    location: user?.location ?? "",
    username: user?.username ?? "",
    phone_number: user?.phone_number ?? "",
    avatar: user?.avatar ?? "",
    role: user?.role ?? "USER",
    created_at: user?.created_at ?? "",
    updated_at: user?.updated_at ?? "",
  }));

  const formatDate = (dateString: string) => {
    if (!dateString)
      return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
      });
    }
    catch {
      return dateString;
    }
  };

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", onPress: () => {} },
      {
        text: "Đăng xuất",
        onPress: async () => {
          const refreshToken = await getRefreshToken();
          if (!refreshToken)
            return;
          logOut(String(refreshToken));
          navigation.navigate("Login" as never);
        },
      },
    ]);
  };

  const handleChangePassword = () => {
    navigation.navigate("ChangePassword" as never);
  };

  const handleUpdateProfile = () => {
    navigation.navigate("UpdateProfile" as never);
  };

  const handleSupport = () => {
    navigation.navigate("Support" as never);
  };
  const handleWallet = () => {
    navigation.navigate("MyWallet" as never);
  };
  const handleReservations = () => {
    navigation.navigate("Reservations" as never);
  };

  const renderMenuOption = (
    icon: string,
    title: string,
    subtitle: string,
    onPress: () => void,
  ) => (
    <TouchableOpacity style={styles.menuOption} onPress={onPress}>
      <View style={styles.menuIconContainer}>
        <Ionicons name={icon as any} size={20} color="#0066FF" />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={["#0066FF", "#00B4D8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingTop: insets.top + 32,
            paddingBottom: 38,
            paddingHorizontal: 24,
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
            marginBottom: 8,
            alignItems: "center",
            elevation: 8,
          }}
        >
          {/* Nút Back nổi lên trên cùng */}
          <TouchableOpacity
            style={{
              position: "absolute",
              top: insets.top + 10,
              left: 16,
              zIndex: 12,
              borderRadius: 30,
              padding: 6,
            }}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Image
            source={{
              uri: profile.avatar || "https://via.placeholder.com/110",
            }}
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              borderWidth: 4,
              borderColor: "#fff",
              marginBottom: 14,
              backgroundColor: "#EBF3FB",
              shadowColor: "#000",
              shadowOpacity: 0.14,
              shadowRadius: 10,

            }}
          />

          <Text
            style={{
              fontSize: 24,
              fontWeight: "700",
              color: "#fff",
              marginBottom: 6,
            }}
            numberOfLines={1}
          >
            {profile.fullname}
          </Text>
          {/* Thành viên + Stats */}
          <Text
            style={{
              fontSize: 15,
              color: "#e0eaff",
              marginBottom: 18,
              fontWeight: "500",
            }}
            numberOfLines={1}
          >
            Thành viên từ
            {" "}
            {formatDate(profile.created_at)}
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 36,
            }}
          >
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: "#fff" }}>
                0
              </Text>
              <Text style={{ fontSize: 13, color: "#e0eaff", marginTop: 2 }}>
                Chuyến đi
              </Text>
            </View>
          </View>
        </LinearGradient>
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="mail" size={18} color="#0066FF" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{profile.email}</Text>
                </View>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Ionicons name="call" size={18} color="#0066FF" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Điện thoại</Text>
                  <Text style={styles.infoValue}>
                    {profile.phone_number || "Chưa cập nhật"}
                  </Text>
                </View>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Ionicons name="location" size={18} color="#0066FF" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Địa chỉ</Text>
                  <Text style={styles.infoValue}>
                    {profile.location || "Chưa cập nhật"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cài đặt tài khoản</Text>
            {renderMenuOption(
              "person-outline",
              "Thông tin cá nhân",
              "Quản lý thông tin cá nhân của bạn",
              handleUpdateProfile,
            )}
            {renderMenuOption(
              "lock-closed",
              "Đổi mật khẩu",
              "Cập nhật mật khẩu của bạn",
              handleChangePassword,
            )}
            {renderMenuOption(
              "help-circle",
              "Báo cáo sự cố & Hỗ trợ",
              "Liên hệ với đội hỗ trợ",
              handleSupport,
            )}
            {renderMenuOption(
              "wallet",
              "Ví điện tử",
              "Quản lý ví điện tử của bạn",
              handleWallet,
            )}
            {renderMenuOption(
              "calendar",
              "Đặt trước của tôi",
              "Theo dõi các lượt đặt trước",
              handleReservations,
            )}
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={20} color="#fff" />
            <Text style={styles.logoutButtonText}>Đăng xuất</Text>
          </TouchableOpacity>
          <Text style={styles.versionText}>Phiên bản 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  infoDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 8,
  },
  menuOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#f0f7ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: "#999",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF6B6B",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 16,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  versionText: {
    textAlign: "center",
    fontSize: 12,
    color: "#999",
    marginBottom: 20,
  },
});

export default ProfileScreen;
