import type { StackNavigationProp } from "@react-navigation/stack";
import type { ComponentProps } from "react";

import { useNavigation } from "@react-navigation/native";
import React, { useCallback } from "react";
import { Pressable, ScrollView, StatusBar } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";

import type { RootStackParamList } from "@/types/navigation";

import { IconSymbol } from "@/components/IconSymbol";
import { useIncidentsInfiniteQuery } from "@/screen/incidents/hooks/use-incidents-infinite-query";
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
            <IconSymbol color={iconColor} name={icon} size="lg" />
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
            <IconSymbol color={theme.textTertiary.val} name="chevron-right" size="section" />
          </YStack>
        </XStack>
      </AppCard>
    </Pressable>
  );
}

export default function TechnicianDashboardScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const incidentQuery = useIncidentsInfiniteQuery({ pageSize: 1 }, true);
  const incidentCount = incidentQuery.data?.pages[0]?.pagination.total ?? 0;

  const handleOpenIncidents = useCallback(() => {
    navigation.navigate("TechnicianIncidentList");
  }, [navigation]);

  return (
    <Screen tone="subtle">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <AppHeroHeader size="compact" title="Công cụ kỹ thuật viên" />

        <YStack gap="$5" padding="$4">
          <AppText variant="sectionTitle">Sự cố</AppText>

          <DashboardActionRow
            badge={incidentCount > 0 ? String(incidentCount) : undefined}
            description="Xem danh sách sự cố được hệ thống điều phối và mở chi tiết xử lý."
            icon="warning"
            onPress={handleOpenIncidents}
            title="Xử lý sự cố"
            tone="warning"
          />
        </YStack>
      </ScrollView>
    </Screen>
  );
}
