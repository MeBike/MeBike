import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { BikeColors } from "../../constants/BikeColors";
import { EmailVerificationHeader } from "./components/email-verification-header";
import { OtpInput } from "./components/otp-input";
import { useEmailVerification } from "./hooks/use-email-verification";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  scrollContent: {
    flexGrow: 1,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  verifyButton: {
    backgroundColor: BikeColors.secondary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  verifyButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
  timerContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  timerText: {
    fontSize: 14,
    color: BikeColors.textSecondary,
    marginBottom: 8,
  },
  timerValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: BikeColors.secondary,
  },
  resendButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  resendButtonText: {
    color: BikeColors.secondary,
    fontSize: 16,
    fontWeight: "600",
  },
  resendButtonTextDisabled: {
    color: BikeColors.lightGray,
    fontSize: 16,
    fontWeight: "600",
  },
  skipContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  skipText: {
    color: BikeColors.textSecondary,
    fontSize: 14,
  },
  skipLink: {
    color: BikeColors.secondary,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
});

export default function EmailVerificationScreen() {
  const {
    email,
    otp,
    setOtpDigit,
    timeLeft,
    resendTimeLeft,
    formatTime,
    verify,
    resend,
    skip,
    isVerifying,
    isResending,
    canResend,
    canSubmit,
  } = useEmailVerification();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <EmailVerificationHeader email={email} />

        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Nhập mã OTP (6 chữ số)</Text>

          <OtpInput
            otp={otp}
            disabled={timeLeft <= 0}
            onChangeDigit={setOtpDigit}
          />

          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>Mã OTP sẽ hết hạn trong</Text>
            <Text style={styles.timerValue}>{formatTime(timeLeft)}</Text>
          </View>

          <Pressable
            style={[
              styles.verifyButton,
              (!canSubmit || timeLeft <= 0) && styles.disabledButton,
            ]}
            onPress={verify}
            disabled={!canSubmit || timeLeft <= 0}
          >
            <Text style={styles.verifyButtonText}>
              {isVerifying ? "Đang xác nhận..." : "Xác nhận"}
            </Text>
          </Pressable>

          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>Không nhận được mã OTP?</Text>
          </View>

          <Pressable
            style={styles.resendButton}
            onPress={resend}
            disabled={!canResend}
          >
            <Text
              style={
                canResend
                  ? styles.resendButtonText
                  : styles.resendButtonTextDisabled
              }
            >
              {isResending
                ? "Đang gửi lại..."
                : resendTimeLeft > 0
                  ? `Gửi lại trong ${formatTime(resendTimeLeft)}`
                  : "Gửi lại mã OTP"}
            </Text>
          </Pressable>

          <View style={styles.skipContainer}>
            <Text style={styles.skipText}>Muốn bỏ qua?</Text>
            <Pressable onPress={skip}>
              <Text style={styles.skipLink}>Tiếp tục sau</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
