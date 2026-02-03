import type { StackNavigationProp } from "@react-navigation/stack";

import { useIsFocused, useNavigation, useRoute } from "@react-navigation/native";
import { authService } from "@services/auth/auth-service";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";

import type { RootStackParamList } from "../../../types/navigation";

type ResetPasswordOTPRouteProp = import("@react-navigation/native").RouteProp<
  RootStackParamList,
  "ResetPasswordOTP"
>;

type ResetPasswordOTPNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ResetPasswordOTP"
>;

const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 5 * 60;
const RESEND_COOLDOWN_SECONDS = 5 * 60;

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function useResetPasswordOtp() {
  const navigation = useNavigation<ResetPasswordOTPNavigationProp>();
  const route = useRoute<ResetPasswordOTPRouteProp>();
  const { email } = route.params;
  const isFocused = useIsFocused();

  const [otp, setOtp] = useState<string[]>(Array.from({ length: OTP_LENGTH }, () => ""));
  const [timeLeft, setTimeLeft] = useState(OTP_EXPIRY_SECONDS);
  const [resendTimeLeft, setResendTimeLeft] = useState(RESEND_COOLDOWN_SECONDS);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const isFocusedRef = useRef(false);
  const otpTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resendTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    isFocusedRef.current = isFocused;
    if (!isFocused) {
      if (otpTimerRef.current) {
        clearInterval(otpTimerRef.current);
        otpTimerRef.current = null;
      }
      if (resendTimerRef.current) {
        clearInterval(resendTimerRef.current);
        resendTimerRef.current = null;
      }
    }
  }, [isFocused]);

  useEffect(() => {
    if (!isFocused) {
      return;
    }
    if (otpTimerRef.current) {
      return;
    }
    if (timeLeft <= 0) {
      return;
    }

    otpTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (otpTimerRef.current) {
            clearInterval(otpTimerRef.current);
            otpTimerRef.current = null;
          }
          setOtp(Array.from({ length: OTP_LENGTH }, () => ""));
          setResendTimeLeft(0);
          if (isFocusedRef.current) {
            Alert.alert("Lỗi", "Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại.");
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (otpTimerRef.current) {
        clearInterval(otpTimerRef.current);
        otpTimerRef.current = null;
      }
    };
  }, [isFocused, timeLeft]);

  useEffect(() => {
    if (!isFocused) {
      return;
    }
    if (resendTimerRef.current) {
      return;
    }
    if (resendTimeLeft <= 0) {
      return;
    }

    resendTimerRef.current = setInterval(() => {
      setResendTimeLeft((prev) => {
        if (prev <= 1) {
          if (resendTimerRef.current) {
            clearInterval(resendTimerRef.current);
            resendTimerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (resendTimerRef.current) {
        clearInterval(resendTimerRef.current);
        resendTimerRef.current = null;
      }
    };
  }, [isFocused, resendTimeLeft]);

  const otpCode = useMemo(() => otp.join(""), [otp]);
  const isOtpComplete = otpCode.length === OTP_LENGTH && otp.every(d => d.length === 1);
  const canSubmit = isOtpComplete && timeLeft > 0 && !isVerifying;
  const canResend = resendTimeLeft <= 0 && !isResending;

  const setOtpDigit = useCallback((index: number, value: string) => {
    const next = value.slice(-1);
    setOtp((prev) => {
      const copy = [...prev];
      copy[index] = next;
      return copy;
    });
  }, []);

  const goBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const verify = useCallback(async () => {
    if (!isOtpComplete) {
      Alert.alert("Lỗi", `Vui lòng nhập đủ ${OTP_LENGTH} ký tự OTP`);
      return;
    }

    setIsVerifying(true);
    try {
      navigation.navigate("ResetPasswordForm", {
        email,
        otp: otpCode,
      });
    }
    finally {
      setIsVerifying(false);
    }
  }, [email, isOtpComplete, navigation, otpCode]);

  const resend = useCallback(async () => {
    if (!canResend) {
      return;
    }
    setIsResending(true);
    try {
      const result = await authService.sendResetPassword({ email });
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

      Alert.alert("Thành công", "Mã OTP mới đã được gửi lại");
      setTimeLeft(OTP_EXPIRY_SECONDS);
      setResendTimeLeft(RESEND_COOLDOWN_SECONDS);
      setOtp(Array.from({ length: OTP_LENGTH }, () => ""));
    }
    finally {
      setIsResending(false);
    }
  }, [canResend, email, isResending]);

  return {
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
  };
}
