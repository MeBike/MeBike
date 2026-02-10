import type { UserDetail } from "@services/users/user-service";

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
  emailVerificationCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  verificationStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  verificationStatusLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  verificationStatusContent: {
    marginLeft: 12,
    flex: 1,
  },
  verificationStatusTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  verificationStatusEmail: {
    fontSize: 13,
    color: "#666",
  },
  verificationButtonsRow: {
    flexDirection: "row",
    gap: 8,
  },
  verificationButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  verifyButton: {
    backgroundColor: "#0066FF",
  },
  verifiedButton: {
    backgroundColor: "#10B981",
  },
  resendButton: {
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  verificationButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
  verificationResendButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0066FF",
  },
  disabledVerificationButton: {
    opacity: 0.6,
  },
  disabledButtonText: {
    color: "#ccc",
  },
});

type ProfileEmailVerificationProps = {
  profile: UserDetail;
  isResendingOtp: boolean;
  onVerify: () => void;
  onResend: () => void;
};

function ProfileEmailVerification({
  profile,
  isResendingOtp,
  onVerify,
  onResend,
}: ProfileEmailVerificationProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Xác thực Email</Text>
      <View style={styles.emailVerificationCard}>
        <View style={styles.verificationStatusRow}>
          <View style={styles.verificationStatusLeft}>
            <Ionicons name="mail" size={24} color="#FFA500" />
            <View style={styles.verificationStatusContent}>
              <Text style={styles.verificationStatusTitle}>
                Email Chưa Xác Thực
              </Text>
              <Text style={styles.verificationStatusEmail}>
                {profile.email}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.verificationButtonsRow}>
          <TouchableOpacity
            style={[styles.verificationButton, styles.verifyButton]}
            onPress={onVerify}
          >
            <Ionicons name="key" size={16} color="white" />
            <Text style={styles.verificationButtonText}>Xác thực</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.verificationButton,
              styles.resendButton,
              isResendingOtp && styles.disabledVerificationButton,
            ]}
            onPress={onResend}
            disabled={isResendingOtp}
          >
            <Ionicons name="refresh" size={16} color="#0066FF" />
            <Text style={styles.verificationResendButtonText}>
              {isResendingOtp ? "Đang gửi..." : "Gửi lại"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default ProfileEmailVerification;
