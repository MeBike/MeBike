import type { StackNavigationProp } from "@react-navigation/stack";

import { useResendVerifyEmailMutation } from "@hooks/mutations/AuthNext/use-resend-verify-email-mutation";
import { useVerifyEmailOtpMutation } from "@hooks/mutations/AuthNext/use-verify-email-otp-mutation";
import { useAuthNext } from "@providers/auth-provider-next";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";

import type { RootStackParamList } from "../../../types/navigation";

type EmailVerificationRouteProp = import("@react-navigation/native").RouteProp<
  RootStackParamList,
  "EmailVerification"
>;

type EmailVerificationNavigationProp = StackNavigationProp<
  RootStackParamList,
  "EmailVerification"
>;

const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 10 * 60;
const RESEND_COOLDOWN_SECONDS = 10 * 60;

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function useEmailVerification() {
  const navigation = useNavigation<EmailVerificationNavigationProp>();
  const route = useRoute<EmailVerificationRouteProp>();
  const { email } = route.params;

  const { user, status, hydrate } = useAuthNext();

  const verifyMutation = useVerifyEmailOtpMutation();
  const resendMutation = useResendVerifyEmailMutation();

  const [otp, setOtp] = useState<string[]>(Array.from({ length: OTP_LENGTH }, () => ""));
  const [timeLeft, setTimeLeft] = useState(OTP_EXPIRY_SECONDS);
  const [resendTimeLeft, setResendTimeLeft] = useState(RESEND_COOLDOWN_SECONDS);

  const didHydrateRef = useRef(false);
  useEffect(() => {
    if (didHydrateRef.current) {
      return;
    }
    if (status === "loading" && !user) {
      didHydrateRef.current = true;
      void hydrate();
    }
  }, [hydrate, status, user]);

  useEffect(() => {
    if (timeLeft <= 0) {
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setOtp(Array.from({ length: OTP_LENGTH }, () => ""));
          setResendTimeLeft(0);
          Alert.alert("Lỗi", "Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  useEffect(() => {
    if (resendTimeLeft <= 0) {
      return;
    }
    const timer = setInterval(() => {
      setResendTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resendTimeLeft]);

  const otpCode = useMemo(() => otp.join(""), [otp]);
  const isOtpComplete = otpCode.length === OTP_LENGTH && otp.every(d => d.length === 1);
  const canSubmit = isOtpComplete && timeLeft > 0 && !verifyMutation.isPending;

  const canResend = resendTimeLeft <= 0 && !resendMutation.isPending;

  const setOtpDigit = useCallback((index: number, value: string) => {
    const next = value.slice(-1);
    setOtp((prev) => {
      const copy = [...prev];
      copy[index] = next;
      return copy;
    });
  }, []);

  const verify = useCallback(async () => {
    if (!isOtpComplete) {
      Alert.alert("Lỗi", `Vui lòng nhập đủ ${OTP_LENGTH} ký tự OTP`);
      return;
    }
    if (!user?.id) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin tài khoản. Vui lòng thử lại.");
      return;
    }

    const result = await verifyMutation.mutateAsync({ userId: user.id, otp: otpCode });
    if (!result.ok) {
      if (result.error._tag === "ApiError") {
        Alert.alert("Lỗi", result.error.message ?? "OTP không hợp lệ hoặc đã hết hạn");
        return;
      }
      if (result.error._tag === "NetworkError") {
        Alert.alert("Lỗi", "Không thể kết nối tới máy chủ");
        return;
      }
      Alert.alert("Lỗi", "Không thể xác minh email");
      return;
    }

    await hydrate();
    navigation.navigate("Main");
  }, [hydrate, isOtpComplete, navigation, otpCode, user?.id, verifyMutation]);

  const resend = useCallback(async () => {
    if (!canResend) {
      return;
    }
    if (!user?.id || !user?.email || !user?.fullname) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin tài khoản để gửi lại OTP");
      return;
    }

    const result = await resendMutation.mutateAsync({
      userId: user.id,
      email: user.email,
      fullName: user.fullname,
    });

    if (!result.ok) {
      if (result.error._tag === "ApiError") {
        Alert.alert("Lỗi", result.error.message ?? "Không thể gửi lại OTP");
        return;
      }
      if (result.error._tag === "NetworkError") {
        Alert.alert("Lỗi", "Không thể kết nối tới máy chủ");
        return;
      }
      Alert.alert("Lỗi", "Không thể gửi lại OTP");
      return;
    }

    Alert.alert("Thành công", "Mã OTP đã được gửi lại");
    setTimeLeft(OTP_EXPIRY_SECONDS);
    setResendTimeLeft(RESEND_COOLDOWN_SECONDS);
    setOtp(Array.from({ length: OTP_LENGTH }, () => ""));
  }, [canResend, resendMutation, user?.email, user?.fullname, user?.id]);

  const skip = useCallback(() => {
    Alert.alert(
      "Bỏ qua xác nhận",
      "Bạn chắc chắn muốn bỏ qua xác nhận email? Bạn có thể xác nhận sau.",
      [
        { text: "Không", style: "cancel" },
        {
          text: "Có, bỏ qua",
          onPress: () => navigation.navigate("Main"),
        },
      ],
    );
  }, [navigation]);

  return {
    email,
    user,
    otp,
    setOtpDigit,
    timeLeft,
    resendTimeLeft,
    formatTime,
    verify,
    resend,
    skip,
    isVerifying: verifyMutation.isPending,
    isResending: resendMutation.isPending,
    canSubmit,
    canResend,
  };
}
