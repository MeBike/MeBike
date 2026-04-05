import React from "react";
import { Pressable } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";

import { IconSymbol } from "@/components/IconSymbol";
import { AppCard } from "@/ui/primitives/app-card";
import { AppText } from "@/ui/primitives/app-text";
import { StatusBadge } from "@/ui/primitives/status-badge";

export function ResultCard({
  title,
  rentalIdLabel,
  statusText,
  statusTone,
  bikeIdLabel,
  startTimeLabel,
  durationLabel,
  stationLabel,
  onPress,
}: {
  title: string;
  rentalIdLabel: string;
  statusText: string;
  statusTone: "success" | "warning" | "danger" | "neutral";
  bikeIdLabel: string;
  startTimeLabel: string;
  durationLabel: string;
  stationLabel?: string;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.985 : 1,
        transform: [{ scale: pressed ? 0.996 : 1 }],
      })}
    >
      <AppCard borderRadius="$4" chrome="whisper" gap="$4" padding="$4">
        <XStack alignItems="center" gap="$3">
          <XStack alignItems="center" backgroundColor="$surfaceAccent" borderRadius="$round" height={44} justifyContent="center" width={44}>
            <IconSymbol color={theme.textBrand.val} name="person.fill" size={22} />
          </XStack>

          <YStack flex={1} gap="$1">
            <AppText numberOfLines={1} variant="bodyStrong">{title}</AppText>
            <AppText tone="muted" variant="bodySmall">{rentalIdLabel}</AppText>
          </YStack>

          <StatusBadge
            label={statusText}
            pulseDot={statusText === "Đang thuê"}
            tone={statusTone}
            withDot
          />
        </XStack>

        <YStack gap="$3">
          <XStack alignItems="center" gap="$3">
            <IconSymbol color={theme.textBrand.val} name="bicycle" size={18} />
            <AppText flex={1} tone="muted" variant="bodySmall">{bikeIdLabel}</AppText>
          </XStack>

          <XStack alignItems="center" gap="$3">
            <IconSymbol color={theme.textSecondary.val} name="clock" size={16} />
            <AppText flex={1} tone="muted" variant="bodySmall">{startTimeLabel}</AppText>
          </XStack>

          <XStack alignItems="center" gap="$3">
            <IconSymbol color={theme.textSecondary.val} name="timer" size={16} />
            <AppText flex={1} tone="muted" variant="bodySmall">{durationLabel}</AppText>
          </XStack>

          {stationLabel
            ? (
                <XStack alignItems="center" gap="$3">
                  <IconSymbol color={theme.textSecondary.val} name="location.fill" size={16} />
                  <AppText flex={1} numberOfLines={1} tone="muted" variant="bodySmall">{stationLabel}</AppText>
                </XStack>
              )
            : null}
        </YStack>

        <XStack alignItems="center" borderTopColor="$borderSubtle" borderTopWidth={1} justifyContent="space-between" paddingTop="$3">
          <AppText tone="muted" variant="caption">Chạm để quản lý phiên thuê</AppText>
          <IconSymbol color={theme.textTertiary.val} name="chevron.right" size={18} />
        </XStack>
      </AppCard>
    </Pressable>
  );
}
