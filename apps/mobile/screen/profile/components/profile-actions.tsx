import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
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

type ProfileActionsProps = {
  onUpdateProfile: () => void;
  onChangePassword: () => void;
  onLogout: () => void;
};

function ProfileActions({
  onUpdateProfile,
  onChangePassword,
  onLogout,
}: ProfileActionsProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Cài đặt tài khoản</Text>
      <TouchableOpacity
        style={styles.menuOption}
        onPress={onUpdateProfile}
      >
        <View style={styles.menuIconContainer}>
          <Ionicons name="person-outline" size={20} color="#0066FF" />
        </View>
        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>Thông tin cá nhân</Text>
          <Text style={styles.menuSubtitle}>Quản lý thông tin cá nhân của bạn</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.menuOption}
        onPress={onChangePassword}
      >
        <View style={styles.menuIconContainer}>
          <Ionicons name="lock-closed" size={20} color="#0066FF" />
        </View>
        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>Đổi mật khẩu</Text>
          <Text style={styles.menuSubtitle}>Cập nhật mật khẩu của bạn</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={onLogout}
      >
        <Ionicons name="log-out" size={20} color="#fff" />
        <Text style={styles.logoutButtonText}>Đăng xuất</Text>
      </TouchableOpacity>
      <Text style={styles.versionText}>Phiên bản 1.0.0</Text>
    </View>
  );
}

export default ProfileActions;
