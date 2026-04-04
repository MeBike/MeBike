import type { StackNavigationProp } from "@react-navigation/stack";
import type { ComponentProps } from "react";

import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback } from "react";
import { Alert, Pressable, ScrollView, StatusBar } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";

import type { RootStackParamList } from "@/types/navigation";

import { IconSymbol } from "@/components/IconSymbol";
import { useStaffBikeSwapRequestsQuery } from "@/hooks/query/rentals/use-staff-bike-swap-requests-query";
import { useAuthNext } from "@/providers/auth-provider-next";
import { gradients } from "@/theme/colors";
import { radii, spacingRules } from "@/theme/metrics";
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
  const theme = useTheme();
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
        <LinearGradient
          colors={gradients.brandHero}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={{
            borderBottomLeftRadius: radii.xxl + 12,
            borderBottomRightRadius: radii.xxl + 12,
            overflow: "hidden",
            paddingBottom: 36,
            paddingHorizontal: spacingRules.hero.paddingX,
            paddingTop: 64,
          }}
        >
          <YStack gap="$4" position="relative">
            <IconSymbol
              color={theme.overlayGlassMuted.val}
              name="antenna.radiowaves.left.and.right"
              size={128}
              style={{ opacity: 0.7, position: "absolute", right: -8, top: -8 }}
            />

            <YStack gap="$2" maxWidth="88%" pr="$8">
              <AppText numberOfLines={2} tone="inverted" variant="hero">
                Công cụ nhân viên
              </AppText>
            </YStack>

          </YStack>
        </LinearGradient>

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
