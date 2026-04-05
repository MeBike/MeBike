import type { StackNavigationProp } from "@react-navigation/stack";
import type { ComponentProps } from "react";

import { useNavigation } from "@react-navigation/native";
import React, { useCallback } from "react";
import { Alert, Pressable, ScrollView, StatusBar } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";

import type { RootStackParamList } from "@/types/navigation";

import { IconSymbol } from "@/components/IconSymbol";
import { useStaffBikeSwapRequestsQuery } from "@/hooks/query/rentals/use-staff-bike-swap-requests-query";
import { useAuthNext } from "@/providers/auth-provider-next";
import { AppHeroHeader } from "@/ui/patterns/app-hero-header";
import { AppCard } from "@/ui/primitives/app-card";
import { AppText } from "@/ui/primitives/app-text";
import { Screen } from "@/ui/primitives/screen";

type DashboardActionRowProps = {
  icon: ComponentProps<typeof IconSymbol>["name"];
  title: string;
  description: string;
  tone?: "primary" | "secondary" | "warning";
  badge?: string;
  onPress: () => void;
};

function DashboardActionRow({
  icon,
  title,
  description,
  tone = "primary",
  badge,
  onPress,
}: DashboardActionRowProps) {
  const theme = useTheme();
  const iconBackground = tone === "secondary"
    ? "$secondary2"
    : tone === "warning"
      ? "$warning2"
      : "$surfaceAccent";
  const iconColor = tone === "secondary"
    ? theme.actionSecondary.val
    : tone === "warning"
      ? theme.actionAccent.val
      : theme.actionPrimary.val;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.985 : 1,
        transform: [{ scale: pressed ? 0.996 : 1 }],
      })}
    >
      <AppCard
        borderRadius="$4"
        chrome="whisper"
        gap="$4"
        padding="$4"
      >
        <XStack
          alignItems="center"
          gap="$4"
        >
          <XStack
            alignItems="center"
            backgroundColor={iconBackground}
            borderRadius="$round"
            height={56}
            justifyContent="center"
            width={56}
          >
            <IconSymbol color={iconColor} name={icon} size={24} />
          </XStack>

          <YStack flex={1} gap="$1">
            <AppText variant="bodyStrong">{title}</AppText>
            <AppText tone="muted" variant="bodySmall">
              {description}
            </AppText>
          </YStack>

          <YStack alignItems="center" gap="$3">
            {badge
              ? (
                  <YStack
                    alignItems="center"
                    backgroundColor="$surfaceWarning"
                    borderRadius="$round"
                    minWidth={32}
                    paddingHorizontal="$2"
                    paddingVertical="$1"
                  >
                    <AppText tone="warning" variant="badgeLabel">
                      {badge}
                    </AppText>
                  </YStack>
                )
              : null}
            <IconSymbol color={theme.textTertiary.val} name="chevron.right" size={22} />
          </YStack>
        </XStack>
      </AppCard>
    </Pressable>
  );
}

export default function StaffDashboardScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { isStaff } = useAuthNext();
  const pendingBikeSwapQuery = useStaffBikeSwapRequestsQuery(
    {
      status: "PENDING",
      page: 1,
      pageSize: 1,
      sortBy: "createdAt",
      sortDir: "desc",
    },
    isStaff,
  );
  const pendingRequestCount = pendingBikeSwapQuery.data?.pagination.total ?? 0;

  const handleScanQr = useCallback(() => {
    navigation.navigate("QRScanner");
  }, [navigation]);

  const handlePhoneLookup = useCallback(() => {
    navigation.navigate("StaffPhoneLookup");
  }, [navigation]);

  const handleOpenBikeSwap = useCallback(() => {
    Alert.alert(
      "Yêu cầu đổi xe",
      "Màn hình danh sách xử lý đổi xe sẽ được migrate tiếp theo. Hiện tại dashboard đã hiển thị số yêu cầu pending để staff thấy ngay.",
    );
  }, []);

  return (
    <Screen tone="subtle">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <AppHeroHeader size="compact" title="Công cụ nhân viên" />

        <YStack gap="$5" padding="$4">
          <AppText variant="sectionTitle">Công cụ hỗ trợ</AppText>

          <YStack gap="$4">
            <DashboardActionRow
              description="Hỗ trợ khách bắt đầu hoặc kết thúc chuyến đi ngay tại xe."
              icon="qrcode.viewfinder"
              onPress={handleScanQr}
              title="Quét mã QR"
            />
            <DashboardActionRow
              description="Tìm phiên thuê đang hoạt động bằng số điện thoại của khách."
              icon="phone.fill"
              onPress={handlePhoneLookup}
              title="Tra cứu bằng SĐT"
              tone="secondary"
            />
            <DashboardActionRow
              badge={pendingRequestCount > 0 ? String(pendingRequestCount) : undefined}
              description="Xem và xử lý yêu cầu đổi xe của khách tại trạm hiện tại."
              icon="arrow.clockwise"
              onPress={handleOpenBikeSwap}
              title="Xử lý đổi xe"
              tone="warning"
            />
          </YStack>
        </YStack>
      </ScrollView>
    </Screen>
  );
}
