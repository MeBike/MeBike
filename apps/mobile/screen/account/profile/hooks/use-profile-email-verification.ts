import type { UserDetail } from "@services/users/user-service";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { Alert } from "react-native";

import { useResendVerifyEmailMutation } from "@/hooks/mutations/AuthNext/use-resend-verify-email-mutation";
import { useVerifyEmailOtpMutation } from "@/hooks/mutations/AuthNext/use-verify-email-otp-mutation";
import { authQueryKeys } from "@/hooks/query/auth-next/auth-query-keys";
import { presentAuthError } from "@/presenters/auth/auth-error-presenter";

type UseProfileEmailVerificationParams = {
  profile: UserDetail;
  hydrate: () => Promise<void>;
};

export function useProfileEmailVerification({
  profile,
  hydrate,
}: UseProfileEmailVerificationParams) {
  const queryClient = useQueryClient();
  const [isVerifyEmailModalOpen, setIsVerifyEmailModalOpen] = useState(false);
  const resendOtpMutation = useResendVerifyEmailMutation();
  const verifyOtpMutation = useVerifyEmailOtpMutation();

  const handleResendOtp = useCallback(async () => {
    if (profile.verify === "VERIFIED") {
      Alert.alert("Info", "Email của bạn đã được xác thực.");
      return;
    }

    try {
      const result = await resendOtpMutation.mutateAsync({
        userId: profile.id,
        email: profile.email,
        fullName: profile.fullName,
      });

      if (!result.ok) {
        Alert.alert("Lỗi", presentAuthError(result.error));
        return;
      }

      Alert.alert("Success", "Mã OTP mới đã được gửi đến email của bạn!");
      setIsVerifyEmailModalOpen(true);
    }
    catch {
      Alert.alert("Lỗi", "Không thể gửi lại OTP. Vui lòng thử lại.");
    }
  }, [profile.email, profile.fullName, profile.id, profile.verify, resendOtpMutation]);

  const handleVerifyEmail = useCallback(async (otp: string) => {
    try {
      const result = await verifyOtpMutation.mutateAsync({ userId: profile.id, otp });

      if (!result.ok) {
        Alert.alert("Lỗi", presentAuthError(result.error));
        return;
      }

      Alert.alert("Success", "Email đã được xác thực.");
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.me() });
      await hydrate();
      setTimeout(() => {
        setIsVerifyEmailModalOpen(false);
      }, 500);
    }
    catch {
      Alert.alert("Lỗi", "Xác thực thất bại. Vui lòng thử lại.");
    }
  }, [hydrate, profile.id, queryClient, verifyOtpMutation]);

  const openVerifyModal = useCallback(() => {
    setIsVerifyEmailModalOpen(true);
  }, []);

  const closeVerifyModal = useCallback(() => {
    setIsVerifyEmailModalOpen(false);
  }, []);

  return {
    isVerifyEmailModalOpen,
    openVerifyModal,
    closeVerifyModal,
    isResendingOtp: resendOtpMutation.isPending,
    isVerifyingOtp: verifyOtpMutation.isPending,
    handleResendOtp,
    handleVerifyEmail,
  };
}
