import { useNavigation } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";

import type { UserDetail } from "@services/users/user-service";

import { authQueryKeys } from "@/hooks/query/auth-next/auth-query-keys";
import { useMyRentalCountsQuery } from "@hooks/query/rentals/use-my-rental-counts-query";
import { invalidateMyRentalCountsQuery } from "@hooks/rentals/rental-cache";
import { useAuthNext } from "@providers/auth-provider-next";

import { useProfileEmailVerification } from "./use-profile-email-verification";

function buildProfile(user: UserDetail | null | undefined): UserDetail {
  return {
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
  };
}

export function useProfile() {
  const navigation = useNavigation();
  const { user, logout, isCustomer, hydrate } = useAuthNext();
  const queryClient = useQueryClient();
  const hasToken = Boolean(user?.id);
  const shouldLoadRentalCounts = hasToken && isCustomer;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const profile = useMemo(() => buildProfile(user), [user]);

  const { data: rentalCounts, isLoading: isRentalCountsLoading } = useMyRentalCountsQuery({
    enabled: shouldLoadRentalCounts,
  });
  const completedTrips = rentalCounts?.COMPLETED ?? 0;
  const {
    closeVerifyModal,
    handleResendOtp,
    handleVerifyEmail,
    isResendingOtp,
    isVerifyEmailModalOpen,
    isVerifyingOtp,
    openVerifyModal,
  } = useProfileEmailVerification({
    profile,
    hydrate,
  });

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: authQueryKeys.me() }),
      invalidateMyRentalCountsQuery(queryClient),
      hydrate(),
    ]);
    setIsRefreshing(false);
  }, [queryClient, hydrate]);

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

  const handleEnvironmentImpact = () => {
    navigation.navigate("EnvironmentImpact" as never);
  };

  const handleNotifications = () => {
    Alert.alert("Sắp ra mắt", "Quản lý thông báo sẽ sớm được cập nhật.");
  };

  return {
    profile,
    isVerifyEmailModalOpen,
    openVerifyModal,
    closeVerifyModal,
    isResendingOtp,
    isVerifyingOtp,
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
    handleEnvironmentImpact,
    handleNotifications,
    handleResendOtp,
    handleVerifyEmail,
  };
}
