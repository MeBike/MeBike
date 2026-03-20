import { spacing } from "@theme/metrics";
import { AuthScreen } from "@ui/patterns/auth-screen";
import { AppButton } from "@ui/primitives/app-button";
import { AppText } from "@ui/primitives/app-text";
import { OtpCodeInput } from "@ui/primitives/otp-code-input";
import { Pressable, StyleSheet, View } from "react-native";

import { EmailVerificationHeader } from "./components/email-verification-header";
import { useEmailVerification } from "./hooks/use-email-verification";

const styles = StyleSheet.create({
  formContainer: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  content: {
    gap: spacing.xxxl,
  },
  timerContainer: {
    alignItems: "center",
    gap: spacing.sm,
  },
  helperBlock: {
    gap: spacing.sm,
  },
  actions: {
    gap: spacing.xxl,
  },
  resendButton: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  skipContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.sm,
    gap: spacing.xs,
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
    goBack,
    isVerifying,
    isResending,
    canResend,
    canSubmit,
  } = useEmailVerification();

  return (
    <AuthScreen header={<EmailVerificationHeader email={email} onBack={goBack} />}>
      <View style={styles.formContainer}>
        <View style={styles.content}>
          <View style={styles.helperBlock}>
            <AppText variant="fieldLabel">Nhập mã OTP (6 chữ số)</AppText>
            <OtpCodeInput disabled={timeLeft <= 0} otp={otp} onChangeDigit={setOtpDigit} />
          </View>

          <View style={styles.timerContainer}>
            <AppText align="center" tone="muted" variant="bodySmall">
              Mã OTP sẽ hết hạn trong
              {" "}
              {formatTime(timeLeft)}
            </AppText>
          </View>

          <View style={styles.actions}>
            <AppButton
              backgroundColor={canSubmit && timeLeft > 0 ? "$brandPrimary" : "$divider"}
              borderColor={canSubmit && timeLeft > 0 ? "$brandPrimary" : "$divider"}
              disabled={!canSubmit || timeLeft <= 0}
              loading={isVerifying}
              onPress={verify}
            >
              <AppText
                align="center"
                tone={canSubmit && timeLeft > 0 ? "inverted" : "muted"}
                variant="bodySmall"
              >
                Xác nhận
              </AppText>
            </AppButton>

            <View style={styles.timerContainer}>
              <AppText align="center" tone="muted" variant="bodySmall">
                Không nhận được mã OTP?
              </AppText>
              <Pressable style={styles.resendButton} onPress={resend} disabled={!canResend}>
                <AppText tone={canResend ? "brand" : "muted"} variant="label">
                  {isResending
                    ? "Đang gửi lại..."
                    : resendTimeLeft > 0
                      ? `Gửi lại trong ${formatTime(resendTimeLeft)}`
                      : "Gửi lại mã OTP"}
                </AppText>
              </Pressable>
            </View>

            <View style={styles.skipContainer}>
              <AppText tone="muted" variant="bodySmall">Muốn bỏ qua?</AppText>
              <Pressable onPress={skip}>
                <AppText tone="brand" variant="label">Tiếp tục sau</AppText>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </AuthScreen>
  );
}
