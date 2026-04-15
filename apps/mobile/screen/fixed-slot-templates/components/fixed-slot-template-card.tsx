import React from "react";
import { Pressable, View } from "react-native";
import { useTheme, XStack } from "tamagui";

import type { FixedSlotTemplate } from "@/contracts/server";

import { IconSymbol } from "@/components/IconSymbol";
import { getFixedSlotStatusTone, presentFixedSlotStatus } from "@/presenters/fixed-slots/fixed-slot-presenter";
import { AppCard } from "@/ui/primitives/app-card";
import { AppText } from "@/ui/primitives/app-text";
import { StatusBadge } from "@/ui/primitives/status-badge";

type Props = {
  template: FixedSlotTemplate;
  isSelected?: boolean;
  onSelect?: () => void;
};

export function FixedSlotTemplateCard({
  template,
  isSelected,
  onSelect,
}: Props) {
  const theme = useTheme();
  const selectedDateCount = template.slotDates.length;
  const slotStartLabel = template.slotStart;
  const statusLabel = presentFixedSlotStatus(template.status);
  const statusTone = getFixedSlotStatusTone(template.status);

  return (
    <Pressable onPress={onSelect}>
      {({ pressed }) => (
        <View
          style={{
            opacity: pressed ? 0.985 : 1,
            transform: [{ scale: pressed ? 0.988 : 1 }],
          }}
        >
          <AppCard
            borderColor={isSelected ? "$borderFocus" : "$borderSubtle"}
            borderWidth={1}
            borderRadius="$5"
            chrome="whisper"
            gap="$4"
            size="compact"
          >
            <XStack alignItems="center" justifyContent="space-between">
              <StatusBadge
                label={statusLabel.toUpperCase()}
                pulseDot={template.status === "ACTIVE"}
                size="compact"
                tone={statusTone}
                withDot
              />
              <XStack
                alignItems="center"
                backgroundColor="$surfaceMuted"
                borderColor="$borderSubtle"
                borderRadius="$3"
                borderWidth={1}
                gap="$2"
                paddingHorizontal="$3"
                paddingVertical="$2"
              >
                <IconSymbol color={theme.textTertiary.val} name="clock" size="caption" />
                <AppText variant="badgeLabel">{slotStartLabel}</AppText>
              </XStack>
            </XStack>

            <AppText numberOfLines={1} variant="cardTitle">{template.station.name}</AppText>

            <XStack alignItems="center" borderTopColor="$borderSubtle" borderTopWidth={1} gap="$2" paddingTop="$3">
              <IconSymbol color={theme.actionPrimary.val} name="calendar" size="sm" />
              <AppText flex={1} tone="muted" variant="bodySmall">
                <AppText variant="bodyStrong">{selectedDateCount}</AppText>
                {" "}
                ngày đã đặt
              </AppText>
              <IconSymbol color={theme.textTertiary.val} name="chevron-right" size="sm" />
            </XStack>
          </AppCard>
        </View>
      )}
    </Pressable>
  );
}
