import { VerifyEmailModal } from "@components/verify-email-modal";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { Screen } from "@ui/primitives/screen";
import { useMemo } from "react";
import { RefreshControl, ScrollView, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Separator, useTheme, YStack } from "tamagui";

import { borderWidths, elevations, radii } from "@theme/metrics";

import ProfileHeader from "./components/profile-header";
import ProfileMenuOption from "./components/profile-menu-option";
import { useProfile } from "./hooks/use-profile";

type MenuItem = {
  icon: Parameters<typeof ProfileMenuOption>[0]["icon"];
  title: string;
  subtitle?: string;
  iconColor: string;
  iconBackground: string;
  onPress: () => void;
  destructive?: boolean;
};

function SectionLabel({ title }: { title: string }) {
  return (
    <AppText opacity={0.7} tone="subtle" variant="eyebrow">
      {title}
    </AppText>
  );
}

function MenuGroup({ items }: { items: MenuItem[] }) {
  return (
    <AppCard
      backgroundColor="$surfaceDefault"
      borderColor="$borderSubtle"
      borderRadius={radii.xxl}
      borderWidth={borderWidths.subtle}
      chrome="flat"
      overflow="hidden"
      padding="$0"
      style={elevations.whisper}
    >
      {items.map((item, index) => (
        <YStack key={item.title}>
          <ProfileMenuOption {...item} />
          {index < items.length - 1 ? <Separator borderColor="$backgroundSubtle" /> : null}
        </YStack>
      ))}
    </AppCard>
  );
}

function ProfileScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const {
    profile,
    isVerifyEmailModalOpen,
    openVerifyModal,
    closeVerifyModal,
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
    handleSupport,
    handleReportIssue,
    handleReservations,
    handleSubscriptions,
    handleNotifications,
    handleVerifyEmail,
  } = useProfile();

  const activityItems = useMemo<MenuItem[]>(() => {
    const items: MenuItem[] = [
      {
        icon: "calendar",
        title: "Đặt trước của tôi",
        subtitle: "Theo dõi các lượt đặt trước của bạn",
        iconColor: theme.actionPrimary.val,
        iconBackground: theme.surfaceAccent.val,
        onPress: handleReservations,
      },
    ];

    if (isCustomer) {
      items.push({
        icon: "bicycle.circle.fill",
        title: "Gói tháng",
        subtitle: "Ưu đãi và lịch sử sử dụng",
        iconColor: theme.actionPrimary.val,
        iconBackground: theme.surfaceAccent.val,
        onPress: handleSubscriptions,
      });
    }

    return items;
  }, [handleReservations, handleSubscriptions, isCustomer, theme.actionPrimary.val, theme.surfaceAccent.val]);

  const accountItems = useMemo<MenuItem[]>(() => [
    {
      icon: "person",
      title: "Thông tin cá nhân",
      subtitle: "Cập nhật tên, email, địa chỉ",
      iconColor: theme.statusSuccess.val,
      iconBackground: theme.surfaceSuccess.val,
      onPress: handleUpdateProfile,
    },
    {
      icon: "lock.shield.fill",
      title: "Bảo mật & Mật khẩu",
      subtitle: "Giữ tài khoản của bạn luôn an toàn",
      iconColor: theme.statusWarning.val,
      iconBackground: theme.surfaceWarning.val,
      onPress: handleChangePassword,
    },
    {
      icon: "bell",
      title: "Thông báo",
      subtitle: "Tùy chỉnh nhắc nhở và cập nhật",
      iconColor: "#DB2777",
      iconBackground: "#FCE7F3",
      onPress: handleNotifications,
    },
  ], [
    handleChangePassword,
    handleNotifications,
    handleUpdateProfile,
    theme.statusSuccess.val,
    theme.statusWarning.val,
    theme.surfaceSuccess.val,
    theme.surfaceWarning.val,
  ]);

  const supportItems = useMemo<MenuItem[]>(() => [
    {
      icon: "exclamationmark.triangle",
      title: "Báo cáo sự cố xe",
      subtitle: "Gửi phản ánh nhanh cho đội hỗ trợ",
      iconColor: theme.textDanger.val,
      iconBackground: theme.surfaceDanger.val,
      onPress: handleReportIssue,
    },
    {
      icon: "questionmark.circle",
      title: "Trung tâm trợ giúp",
      subtitle: "Câu hỏi thường gặp và hỗ trợ",
      iconColor: theme.textSecondary.val,
      iconBackground: theme.surfaceMuted.val,
      onPress: handleSupport,
    },
  ], [handleReportIssue, handleSupport, theme.surfaceDanger.val, theme.surfaceMuted.val, theme.textDanger.val, theme.textSecondary.val]);

  const destructiveItems = useMemo<MenuItem[]>(() => [
    {
      icon: "arrow.right",
      title: "Đăng xuất",
      iconColor: theme.textDanger.val,
      iconBackground: theme.surfaceDanger.val,
      onPress: handleLogout,
      destructive: true,
    },
  ], [handleLogout, theme.surfaceDanger.val, theme.textDanger.val]);

  return (
    <Screen tone="subtle">
      <StatusBar barStyle="light-content" backgroundColor={theme.actionPrimary.val} translucent />

      <ScrollView
        refreshControl={<RefreshControl colors={[theme.actionPrimary.val]} onRefresh={onRefresh} refreshing={isRefreshing} tintColor={theme.actionPrimary.val} />}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader
          completedTrips={completedTrips}
          formatDate={formatDate}
          isLoadingTrips={isRentalCountsLoading}
          onVerifyEmail={openVerifyModal}
          profile={profile}
          topInset={insets.top}
        />

        <YStack gap="$6" paddingHorizontal="$5" paddingTop="$6" paddingBottom="$7">
          <YStack gap="$3">
            <SectionLabel title="Hoạt động của tôi" />
            <MenuGroup items={activityItems} />
          </YStack>

          <YStack gap="$3">
            <SectionLabel title="Cài đặt tài khoản" />
            <MenuGroup items={accountItems} />
          </YStack>

          <YStack gap="$3">
            <SectionLabel title="Hỗ trợ" />
            <MenuGroup items={supportItems} />
          </YStack>

          <YStack gap="$4">
            <MenuGroup items={destructiveItems} />
            <AppText align="center" opacity={0.58} tone="subtle" variant="eyebrow">
              Phiên bản 1.0.0
            </AppText>
          </YStack>
        </YStack>
      </ScrollView>

      <VerifyEmailModal
        isLoading={isVerifyingOtp}
        onClose={closeVerifyModal}
        onSubmit={handleVerifyEmail}
        visible={isVerifyEmailModalOpen}
      />
    </Screen>
  );
}

export default ProfileScreen;
