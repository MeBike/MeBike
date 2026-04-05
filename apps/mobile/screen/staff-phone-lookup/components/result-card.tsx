import React, { useCallback } from "react";
import { Pressable } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";

import { IconSymbol } from "@/components/IconSymbol";
import { borderWidths, elevations } from "@/theme/metrics";
import { AppCard } from "@/ui/primitives/app-card";
import { AppText } from "@/ui/primitives/app-text";
import { StatusBadge } from "@/ui/primitives/status-badge";

type ResultCardProps = {
  onSelect: (rentalId: string) => void;
  rentalId: string;
  title: string;
  statusText: string;
  statusTone: "success" | "warning" | "danger" | "neutral";
  stationLabel?: string;
};

export function ResultCard({
  onSelect,
  rentalId,
  title,
  statusText,
  statusTone,
  stationLabel,
}: ResultCardProps) {
  const theme = useTheme();
  const handlePress = useCallback(() => {
    onSelect(rentalId);
  }, [onSelect, rentalId]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.985 : 1,
        transform: [{ scale: pressed ? 0.996 : 1 }],
      })}
    >
      <AppCard
        borderColor="$borderSubtle"
        borderLeftColor="$actionPrimary"
        borderLeftWidth={borderWidths.heavy}
        borderRadius="$5"
        borderWidth={borderWidths.subtle}
        chrome="flat"
        gap="$4"
        padding="$5"
        style={elevations.whisper}
      >
        <XStack alignItems="flex-start" justifyContent="space-between" gap="$3">
          <YStack flex={1} gap="$1">
            <AppText numberOfLines={1} variant="cardTitle">{title}</AppText>

            <XStack alignItems="center" gap="$2" paddingTop="$1">
              <IconSymbol color={theme.statusSuccess.val} name="location.fill" size={16} />
              <AppText flex={1} numberOfLines={1} tone="muted" variant="subhead">
                {stationLabel ?? "--"}
              </AppText>
            </XStack>
          </YStack>

          <StatusBadge
            label={statusText}
            pulseDot={statusText === "Đang thuê"}
            size="compact"
            tone={statusTone}
            withDot
          />
        </XStack>
      </AppCard>
    </Pressable>
  );
}
