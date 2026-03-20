import { spacing } from "@theme/metrics";
import { AuthScreen } from "@ui/patterns/auth-screen";
import { AppButton } from "@ui/primitives/app-button";
import { AppText } from "@ui/primitives/app-text";
import { OtpCodeInput } from "@ui/primitives/otp-code-input";
import { Pressable, StyleSheet, View } from "react-native";

import { ResetPasswordOtpHeader } from "./components/reset-password-otp-header";
import { useResetPasswordOtp } from "./hooks/use-reset-password-otp";

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxxl,
    gap: spacing.xxxl,
  },
  section: {
    gap: spacing.sm,
  },
  timerRow: {
    alignItems: "center",
  },
  actions: {
    gap: spacing.xxl,
  },
  resendBlock: {
    alignItems: "center",
    gap: spacing.sm,
  },
  resendButton: {
    alignItems: "center",
    paddingVertical: spacing.sm,
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

  const isActive = canSubmit && timeLeft > 0;

  return (
    <AuthScreen header={<ResetPasswordOtpHeader email={email} onBack={goBack} />}>
      <View style={styles.content}>
        <View style={styles.section}>
          <AppText variant="fieldLabel">Nhập mã OTP (6 chữ số)</AppText>
          <OtpCodeInput disabled={timeLeft <= 0} otp={otp} onChangeDigit={setOtpDigit} />
        </View>

        <View style={styles.timerRow}>
          <AppText align="center" tone="muted" variant="bodySmall">
            Mã OTP sẽ hết hạn trong
            {" "}
            {formatTime(timeLeft)}
          </AppText>
        </View>

        <View style={styles.actions}>
          <AppButton
            backgroundColor={isActive ? "$brandPrimary" : "$divider"}
            borderColor={isActive ? "$brandPrimary" : "$divider"}
            disabled={!isActive}
            loading={isVerifying}
            onPress={verify}
          >
            <AppText align="center" tone={isActive ? "inverted" : "muted"} variant="bodySmall">
              Tiếp tục
            </AppText>
          </AppButton>

          <View style={styles.resendBlock}>
            <AppText align="center" tone="muted" variant="bodySmall">
              Không nhận được mã OTP?
            </AppText>
            <Pressable disabled={!canResend} onPress={resend} style={styles.resendButton}>
              <AppText tone={canResend ? "brand" : "muted"} variant="label">
                {isResending
                  ? "Đang gửi lại..."
                  : resendTimeLeft > 0
                    ? `Gửi lại trong ${formatTime(resendTimeLeft)}`
                    : "Gửi lại mã OTP"}
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </AuthScreen>
  );
}
