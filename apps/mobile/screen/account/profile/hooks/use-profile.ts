import { useNavigation } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

import type { UserDetail } from "@services/users/user-service";

import { useResendVerifyEmailMutation } from "@/hooks/mutations/AuthNext/use-resend-verify-email-mutation";
import { useVerifyEmailOtpMutation } from "@/hooks/mutations/AuthNext/use-verify-email-otp-mutation";
import { presentAuthError } from "@/presenters/auth/auth-error-presenter";
import { useMyRentalCountsQuery } from "@hooks/query/rentals/use-my-rental-counts-query";
import { invalidateMyRentalCountsQuery } from "@hooks/rentals/rental-cache";
import { useAuthNext } from "@providers/auth-provider-next";

export function useProfile() {
  const navigation = useNavigation();
  const { user, logout, isCustomer, hydrate } = useAuthNext();
  const queryClient = useQueryClient();
  const hasToken = Boolean(user?.id);
  const [profile, setProfile] = useState<UserDetail>(() => ({
    id: user?.id ?? "",
    fullName: user?.fullName ?? "",
    email: user?.email ?? "",
    accountStatus: user?.accountStatus ?? "ACTIVE",
    verify: user?.verify ?? "UNVERIFIED",
    location: user?.location ?? null,
    username: user?.username ?? null,
    phoneNumber: user?.phoneNumber ?? null,
    avatar: user?.avatar ?? null,
    role: user?.role ?? "USER",
    orgAssignment: user?.orgAssignment ?? null,
    nfcCardUid: user?.nfcCardUid ?? null,
    createdAt: user?.createdAt ?? "",
    updatedAt: user?.updatedAt ?? "",
  }));
  const [isVerifyEmailModalOpen, setIsVerifyEmailModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const resendOtpMutation = useResendVerifyEmailMutation();
  const verifyOtpMutation = useVerifyEmailOtpMutation();

  const { data: rentalCounts, isLoading: isRentalCountsLoading } = useMyRentalCountsQuery({ enabled: hasToken });
  const completedTrips = rentalCounts?.COMPLETED ?? 0;

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["authNext", "me"] }),
      invalidateMyRentalCountsQuery(queryClient),
      hydrate(),
    ]);
    setIsRefreshing(false);
  }, [queryClient, hydrate]);

  useEffect(() => {
    if (user) {
      setProfile({
        id: user.id ?? "",
        fullName: user.fullName ?? "",
        email: user.email ?? "",
        accountStatus: user.accountStatus ?? "ACTIVE",
        verify: user.verify ?? "UNVERIFIED",
        location: user.location ?? null,
        username: user.username ?? null,
        phoneNumber: user.phoneNumber ?? null,
        avatar: user.avatar ?? null,
        role: user.role ?? "USER",
        orgAssignment: user.orgAssignment ?? null,
        nfcCardUid: user.nfcCardUid ?? null,
        createdAt: user.createdAt ?? "",
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

  const handleReservations = () => {
    navigation.navigate("Reservations" as never);
  };

  const handleSubscriptions = () => {
    navigation.navigate("Subscriptions" as never);
  };

  const handleNotifications = () => {
    Alert.alert("Sắp ra mắt", "Quản lý thông báo sẽ sớm được cập nhật.");
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
  };

  const handleVerifyEmail = async (otp: string) => {
    try {
      const result = await verifyOtpMutation.mutateAsync({ userId: profile.id, otp });
      if (!result.ok) {
        Alert.alert("Lỗi", presentAuthError(result.error));
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
    handleReservations,
    handleSubscriptions,
    handleNotifications,
    handleResendOtp,
    handleVerifyEmail,
  };
}
