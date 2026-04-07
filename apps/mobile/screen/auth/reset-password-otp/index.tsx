import { Pressable, View } from "react-native";

import { spaceScale } from "@theme/metrics";
import { AuthScreen } from "@ui/patterns/auth-screen";
import { AppButton } from "@ui/primitives/app-button";
import { AppText } from "@ui/primitives/app-text";
import { OtpCodeInput } from "@ui/primitives/otp-code-input";

import { ResetPasswordOtpHeader } from "./components/reset-password-otp-header";
import { useResetPasswordOtp } from "./hooks/use-reset-password-otp";

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
      <View style={{ paddingHorizontal: spaceScale[6], paddingBottom: spaceScale[7], gap: spaceScale[7] }}>
        <View style={{ gap: spaceScale[2] }}>
          <AppText variant="fieldLabel">Nhập mã OTP (6 chữ số)</AppText>
          <OtpCodeInput disabled={timeLeft <= 0} otp={otp} onChangeDigit={setOtpDigit} />
        </View>

        <View style={{ alignItems: "center" }}>
          <AppText align="center" tone="muted" variant="bodySmall">
            Mã OTP sẽ hết hạn trong
            {" "}
            {formatTime(timeLeft)}
          </AppText>
        </View>

        <View style={{ gap: spaceScale[6] }}>
          <AppButton
            disabled={!isActive}
            loading={isVerifying}
            onPress={verify}
            tone={isActive ? "primary" : "outline"}
          >
            Tiếp tục
          </AppButton>

          <View style={{ alignItems: "center", gap: spaceScale[2] }}>
            <AppText align="center" tone="muted" variant="bodySmall">
              Không nhận được mã OTP?
            </AppText>
            <Pressable disabled={!canResend} onPress={resend} style={{ alignItems: "center", paddingVertical: spaceScale[2] }}>
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
