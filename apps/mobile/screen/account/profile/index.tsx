import { VerifyEmailModal } from "@components/verify-email-modal";
import { borderWidths, elevations, radii } from "@theme/metrics";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { Screen } from "@ui/primitives/screen";
import { useMemo } from "react";
import { RefreshControl, ScrollView, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Separator, useTheme, YStack } from "tamagui";

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
    handleReservations,
    handleSubscriptions,
    handleEnvironmentImpact,
    handleMetroJourney,
    handleNotifications,
    handleVerifyEmail,
  } = useProfile();

  const activityItems = useMemo<MenuItem[]>(() => {
    if (!isCustomer) {
      return [];
    }

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

    items.push({
      icon: "bike",
      title: "Gói tháng",
      subtitle: "Ưu đãi và lịch sử sử dụng",
      iconColor: theme.actionPrimary.val,
      iconBackground: theme.surfaceAccent.val,
      onPress: handleSubscriptions,
    });

    items.push({
      icon: "footprints",
      title: "Tác động môi trường",
      subtitle: "Theo dõi CO2 và quãng đường đã tiết kiệm",
      iconColor: theme.statusSuccess.val,
      iconBackground: theme.surfaceSuccess.val,
      onPress: handleEnvironmentImpact,
    });

    return items;
  }, [
    handleEnvironmentImpact,
    handleReservations,
    handleSubscriptions,
    isCustomer,
    theme.actionPrimary.val,
    theme.statusSuccess.val,
    theme.surfaceAccent.val,
    theme.surfaceSuccess.val,
  ]);

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
      icon: "shield-lock",
      title: "Bảo mật & Mật khẩu",
      subtitle: "Giữ tài khoản của bạn luôn an toàn",
      iconColor: theme.statusWarning.val,
      iconBackground: theme.surfaceWarning.val,
      onPress: handleChangePassword,
    },
    {
      icon: "map",
      title: "Hành trình Metro",
      subtitle: "Xem tàu đang chạy và lịch các ga theo tuyến",
      iconColor: theme.actionPrimary.val,
      iconBackground: theme.surfaceAccent.val,
      onPress: handleMetroJourney,
    },
    {
      icon: "bell",
      title: "Thông báo",
      subtitle: "Tùy chỉnh nhắc nhở và cập nhật",
      iconColor: theme.actionSecondary.val,
      iconBackground: theme.surfaceAccent.val,
      onPress: handleNotifications,
    },
  ], [
    handleChangePassword,
    handleMetroJourney,
    handleNotifications,
    handleUpdateProfile,
    theme.actionPrimary.val,
    theme.statusSuccess.val,
    theme.statusWarning.val,
    theme.actionSecondary.val,
    theme.surfaceSuccess.val,
    theme.surfaceWarning.val,
    theme.surfaceAccent.val,
  ]);

  const destructiveItems = useMemo<MenuItem[]>(() => [
    {
      icon: "arrow-right",
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
          completedTrips={isCustomer ? completedTrips : undefined}
          formatDate={formatDate}
          isLoadingTrips={isCustomer ? isRentalCountsLoading : undefined}
          onVerifyEmail={openVerifyModal}
          profile={profile}
          topInset={insets.top}
        />

        <YStack gap="$6" paddingHorizontal="$5" paddingTop="$6" paddingBottom="$7">
          {activityItems.length > 0
            ? (
                <YStack gap="$3">
                  <SectionLabel title="Hoạt động của tôi" />
                  <MenuGroup items={activityItems} />
                </YStack>
              )
            : null}

          <YStack gap="$3">
            <SectionLabel title="Cài đặt tài khoản" />
            <MenuGroup items={accountItems} />
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
