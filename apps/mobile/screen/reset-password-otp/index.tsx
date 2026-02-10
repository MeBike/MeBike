import { BikeColors } from "@constants/BikeColors";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { OtpInput } from "./components/otp-input";
import { ResetPasswordOtpHeader } from "./components/reset-password-otp-header";
import { useResetPasswordOtp } from "./hooks/use-reset-password-otp";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BikeColors.surface,
  },
  scrollContent: {
    flexGrow: 1,
  },
  body: {
    flex: 1,
    backgroundColor: BikeColors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    paddingTop: 8,
    paddingBottom: 24,
    overflow: "hidden",
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: BikeColors.textPrimary,
    marginBottom: 16,
  },
  timerContainer: {
    alignItems: "center",
    marginBottom: 18,
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
  primaryButton: {
    backgroundColor: BikeColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
  resendHint: {
    alignItems: "center",
    marginBottom: 8,
  },
  resendHintText: {
    fontSize: 14,
    color: BikeColors.textSecondary,
  },
  resendButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  resendButtonText: {
    color: BikeColors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  resendButtonTextDisabled: {
    color: BikeColors.textSecondary,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default function ResetPasswordOTPScreen() {
  const {
    email,
    otp,
    setOtpDigit,
    timeLeft,
    resendTimeLeft,
    formatTime,
    verify,
    resend,
    goBack,
    isVerifying,
    isResending,
    canSubmit,
    canResend,
  } = useResetPasswordOtp();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ResetPasswordOtpHeader onBack={goBack} email={email} />
        <View style={styles.body}>
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Nhập mã OTP (6 chữ số)</Text>

            <OtpInput otp={otp} disabled={timeLeft <= 0} onChangeDigit={setOtpDigit} />

            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>Mã OTP sẽ hết hạn trong</Text>
              <Text style={styles.timerValue}>{formatTime(timeLeft)}</Text>
            </View>

            <Pressable
              style={[styles.primaryButton, (!canSubmit || timeLeft <= 0) && styles.disabledButton]}
              onPress={verify}
              disabled={!canSubmit || timeLeft <= 0}
            >
              <Text style={styles.primaryButtonText}>
                {isVerifying ? "Đang xác nhận..." : "Tiếp tục"}
              </Text>
            </Pressable>

            <View style={styles.resendHint}>
              <Text style={styles.resendHintText}>Không nhận được mã OTP?</Text>
            </View>

            <Pressable style={styles.resendButton} onPress={resend} disabled={!canResend}>
              <Text style={canResend ? styles.resendButtonText : styles.resendButtonTextDisabled}>
                {isResending
                  ? "Đang gửi lại..."
                  : resendTimeLeft > 0
                    ? `Gửi lại trong ${formatTime(resendTimeLeft)}`
                    : "Gửi lại mã OTP"}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
