
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@providers/auth-providers";
import type { DetailUser } from "@services/authService";
import { getRefreshToken } from "@utils/tokenManager";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user , logOut} = useAuth();
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
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long'
      });
    } catch {
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
          if (!refreshToken) return;
          logOut(String(refreshToken));
          navigation.navigate("Login" as never);
        }
      },
    ]);
  };

  const handleChangePassword = () => {
    Alert.alert("Đổi mật khẩu", "Chuyển đến trang đổi mật khẩu");
    navigation.navigate("ChangePassword" as never);
  };

  const handleUpdateProfile = () => {
    Alert.alert("Thông báo", "Chuyển đến cài đặt thông tin cá nhân");
    navigation.navigate("UpdateProfile" as never);

  };

  const handleSupport = () => {
    Alert.alert("Hỗ trợ", "Liên hệ với đội hỗ trợ khách hàng");
  };
  const handleWallet = () => {
    Alert.alert("Ví điện tử", "Quản lý ví điện tử của bạn");
    navigation.navigate("MyWallet" as never);
  };

  const renderMenuOption = (
    icon: string,
    title: string,
    subtitle: string,
    onPress: () => void
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
          style={[styles.header, { paddingTop: insets.top + 16 }]}
        >
          <View style={styles.profileHeader}>
            <Image
              source={{
                uri: profile.avatar || "https://via.placeholder.com/80",
              }}
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile.fullname}</Text>
              <Text style={styles.profileMember}>
                Thành viên từ {formatDate(profile.created_at)}
              </Text>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>0</Text>
                  <Text style={styles.statLabel}>Chuyến đi</Text>
                </View>
              </View>
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
              handleUpdateProfile
            )}
            {renderMenuOption(
              "lock-closed",
              "Đổi mật khẩu",
              "Cập nhật mật khẩu của bạn",
              handleChangePassword
            )}
            {renderMenuOption(
              "help-circle",
              "Hỗ trợ & Trợ giúp",
              "Liên hệ với đội hỗ trợ",
              handleSupport
            )}
            {renderMenuOption(
              "wallet",
              "Ví điện tử",
              "Quản lý ví điện tử của bạn",
              handleWallet
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    borderWidth: 3,
    borderColor: "#fff",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 2,
  },
  profileMember: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: "row",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
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
    marginTop: 20,
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
