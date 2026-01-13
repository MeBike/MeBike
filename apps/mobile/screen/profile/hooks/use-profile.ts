import type { UserDetail } from "@services/users/user-service";

import { useGetRentalCountsQuery } from "@hooks/query/Rent/useGetRentalCountsQuery";
import { useAuthNext } from "@providers/auth-provider-next";
import { useNavigation } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

import { useResendVerifyEmailMutation } from "@/hooks/mutations/AuthNext/use-resend-verify-email-mutation";
import { useVerifyEmailOtpMutation } from "@/hooks/mutations/AuthNext/use-verify-email-otp-mutation";

export function useProfile() {
  const navigation = useNavigation();
  const { user, logout, isCustomer, hydrate } = useAuthNext();
  const queryClient = useQueryClient();
  const hasToken = Boolean(user?.id);
  const [profile, setProfile] = useState<UserDetail>(() => ({
    id: user?.id ?? "",
    fullname: user?.fullname ?? "",
    email: user?.email ?? "",
    verify: user?.verify ?? "UNVERIFIED",
    location: user?.location ?? null,
    username: user?.username ?? null,
    phoneNumber: user?.phoneNumber ?? null,
    avatar: user?.avatar ?? null,
    role: user?.role ?? "USER",
    nfcCardUid: user?.nfcCardUid ?? null,
    updatedAt: user?.updatedAt ?? "",
  }));
  const [isVerifyEmailModalOpen, setIsVerifyEmailModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const resendOtpMutation = useResendVerifyEmailMutation();
  const verifyOtpMutation = useVerifyEmailOtpMutation();

  const authErrorMessage = (error: import("@services/auth/auth-error").AuthError): string => {
    if (error._tag === "ApiError") {
      if (error.code === "INVALID_OTP") {
        return "Mã OTP không đúng hoặc đã hết hạn.";
      }
      return error.message ?? "Yêu cầu thất bại. Vui lòng thử lại.";
    }
    if (error._tag === "NetworkError") {
      return error.message ?? "Không thể kết nối máy chủ. Vui lòng thử lại.";
    }
    return "Yêu cầu thất bại. Vui lòng thử lại.";
  };

  const { data: rentalCountsResponse, isLoading: isRentalCountsLoading } = useGetRentalCountsQuery("HOÀN THÀNH", hasToken);
  const completedTrips = rentalCountsResponse?.data?.result?.counts ?? 0;

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["authNext", "me"] }),
      queryClient.invalidateQueries({ queryKey: ["rentals", "counts"] }),
      hydrate(),
    ]);
    setIsRefreshing(false);
  }, [queryClient, hydrate]);

  useEffect(() => {
    if (user) {
      setProfile({
        id: user.id ?? "",
        fullname: user.fullname ?? "",
        email: user.email ?? "",
        verify: user.verify ?? "UNVERIFIED",
        location: user.location ?? null,
        username: user.username ?? null,
        phoneNumber: user.phoneNumber ?? null,
        avatar: user.avatar ?? null,
        role: user.role ?? "USER",
        nfcCardUid: user.nfcCardUid ?? null,
        updatedAt: user.updatedAt ?? "",
      });
    }
  }, [user]);

  const formatDate = (dateString: string) => {
    if (!dateString)
      return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
      });
    }
    catch {
      return dateString;
    }
  };

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", onPress: () => {} },
      {
        text: "Đăng xuất",
        onPress: async () => {
          await logout();
          navigation.navigate("Login" as never);
        },
      },
    ]);
  };

  const handleChangePassword = () => {
    navigation.navigate("ChangePassword" as never);
  };

  const handleUpdateProfile = () => {
    navigation.navigate("UpdateProfile" as never);
  };

  const handleSupport = () => {
    navigation.navigate("Support" as never);
  };

  const handleReservations = () => {
    navigation.navigate("Reservations" as never);
  };

  const handleSOS = () => {
    navigation.navigate("MySOS" as never);
  };

  const handleSubscriptions = () => {
    navigation.navigate("Subscriptions" as never);
  };

  const handleResendOtp = async () => {
    if (profile.verify === "VERIFIED") {
      Alert.alert("Info", "Email của bạn đã được xác thực.");
      return;
    }

    try {
      const result = await resendOtpMutation.mutateAsync({
        userId: profile.id,
        email: profile.email,
        fullName: profile.fullname,
      });
      if (!result.ok) {
        Alert.alert("Lỗi", authErrorMessage(result.error));
        return;
      }
      Alert.alert("Success", "Mã OTP mới đã được gửi đến email của bạn!");
      setIsVerifyEmailModalOpen(true);
    }
    catch {
      Alert.alert("Lỗi", "Không thể gửi lại OTP. Vui lòng thử lại.");
    }
  };

  const handleVerifyEmail = async (otp: string) => {
    try {
      const result = await verifyOtpMutation.mutateAsync({ userId: profile.id, otp });
      if (!result.ok) {
        Alert.alert("Lỗi", authErrorMessage(result.error));
        return;
      }
      Alert.alert("Success", "Email đã được xác thực.");
      void queryClient.invalidateQueries({ queryKey: ["authNext", "me"] });
      await hydrate();
      setTimeout(() => {
        setIsVerifyEmailModalOpen(false);
      }, 500);
    }
    catch {
      Alert.alert("Lỗi", "Xác thực thất bại. Vui lòng thử lại.");
    }
  };

  const openVerifyModal = () => {
    setIsVerifyEmailModalOpen(true);
  };

  const closeVerifyModal = () => {
    setIsVerifyEmailModalOpen(false);
  };

  const goBack = () => {
    navigation.goBack();
  };

  return {
    profile,
    isVerifyEmailModalOpen,
    openVerifyModal,
    closeVerifyModal,
    isResendingOtp: resendOtpMutation.isPending,
    isVerifyingOtp: verifyOtpMutation.isPending,
    isRefreshing,
    onRefresh,
    isCustomer,
    isRentalCountsLoading,
    completedTrips,
    formatDate,
    handleLogout,
    handleChangePassword,
    handleUpdateProfile,
    handleSupport,
    handleReservations,
    handleSOS,
    handleSubscriptions,
    handleResendOtp,
    handleVerifyEmail,
    goBack,
  };
}
