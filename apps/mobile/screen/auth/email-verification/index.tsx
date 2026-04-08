import { Pressable, View } from "react-native";

import { spaceScale } from "@theme/metrics";
import { AuthScreen } from "@ui/patterns/auth-screen";
import { AppButton } from "@ui/primitives/app-button";
import { AppText } from "@ui/primitives/app-text";
import { OtpCodeInput } from "@ui/primitives/otp-code-input";

import { EmailVerificationHeader } from "./components/email-verification-header";
import { useEmailVerification } from "./hooks/use-email-verification";

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
      <View style={{ paddingHorizontal: spaceScale[6], paddingBottom: spaceScale[7] }}>
        <View style={{ gap: spaceScale[7] }}>
          <View style={{ gap: spaceScale[2] }}>
            <AppText variant="fieldLabel">Nhập mã OTP (6 chữ số)</AppText>
            <OtpCodeInput disabled={timeLeft <= 0} otp={otp} onChangeDigit={setOtpDigit} />
          </View>

          <View style={{ alignItems: "center", gap: spaceScale[2] }}>
            <AppText align="center" tone="muted" variant="bodySmall">
              Mã OTP sẽ hết hạn trong
              {" "}
              {formatTime(timeLeft)}
            </AppText>
          </View>

          <View style={{ gap: spaceScale[6] }}>
            <AppButton
              disabled={!canSubmit || timeLeft <= 0}
              loading={isVerifying}
              onPress={verify}
              tone={canSubmit && timeLeft > 0 ? "primary" : "outline"}
            >
              Xác nhận
            </AppButton>

            <View style={{ alignItems: "center", gap: spaceScale[2] }}>
              <AppText align="center" tone="muted" variant="bodySmall">
                Không nhận được mã OTP?
              </AppText>
              <Pressable style={{ alignItems: "center", paddingVertical: spaceScale[2] }} onPress={resend} disabled={!canResend}>
                <AppText tone={canResend ? "brand" : "muted"} variant="label">
                  {isResending
                    ? "Đang gửi lại..."
                    : resendTimeLeft > 0
                      ? `Gửi lại trong ${formatTime(resendTimeLeft)}`
                      : "Gửi lại mã OTP"}
                </AppText>
              </Pressable>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: spaceScale[2], gap: spaceScale[1] }}>
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
