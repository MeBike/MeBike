import React from "react";
import { Pressable, View } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";

import { IconSymbol } from "@/components/IconSymbol";
import type { FixedSlotTemplate } from "@/contracts/server";
import { getFixedSlotStatusTone, presentFixedSlotStatus } from "@/presenters/fixed-slots/fixed-slot-presenter";
import { AppButton } from "@/ui/primitives/app-button";
import { AppCard } from "@/ui/primitives/app-card";
import { AppText } from "@/ui/primitives/app-text";
import { StatusBadge } from "@/ui/primitives/status-badge";

type Props = {
  template: FixedSlotTemplate;
  isSelected?: boolean;
  onSelect?: () => void;
  onCancel?: () => void;
};

export function FixedSlotTemplateCard({
  template,
  isSelected,
  onSelect,
  onCancel,
}: Props) {
  const theme = useTheme();
  const selectedDateCount = template.slotDates.length;
  const slotStartLabel = template.slotStart;
  const canCancel = template.status !== "CANCELLED";
  const statusLabel = presentFixedSlotStatus(template.status);
  const statusTone = getFixedSlotStatusTone(template.status);
  const content = (
    <YStack gap="$4">
      <XStack alignItems="flex-start" gap="$3" justifyContent="space-between">
        <XStack alignItems="center" flex={1} gap="$3">
          <XStack
            alignItems="center"
            backgroundColor="$surfaceAccent"
            borderRadius="$round"
            height={44}
            justifyContent="center"
            width={44}
          >
            <IconSymbol color={theme.actionPrimary.val} name="clock" size="md" />
          </XStack>
          <YStack flex={1} gap="$1">
            <AppText numberOfLines={2} variant="cardTitle">{template.station.name}</AppText>
            <AppText numberOfLines={1} tone="muted" variant="meta">{template.station.address}</AppText>
          </YStack>
        </XStack>
        <StatusBadge label={statusLabel} size="compact" tone={statusTone} withDot />
      </XStack>

      <AppCard chrome="flat" padding="$4" tone="muted">
        <XStack gap="$4" justifyContent="space-between">
          <YStack flex={1} gap="$1">
            <AppText tone="muted" variant="caption">Giờ bắt đầu</AppText>
            <AppText variant="bodyStrong">{slotStartLabel}</AppText>
          </YStack>
          <YStack flex={1} gap="$1">
            <AppText tone="muted" variant="caption">Ngày áp dụng</AppText>
            <AppText variant="bodyStrong">{selectedDateCount} ngày</AppText>
          </YStack>
        </XStack>
      </AppCard>
    </YStack>
  );

  return (
    <AppCard
      borderColor={isSelected ? "$borderFocus" : "$borderSubtle"}
      borderWidth={1}
      borderRadius="$5"
      chrome="flat"
      gap="$4"
      style={{
        shadowColor: theme.shadowColor.val,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
      }}
    >
      {onSelect
        ? (
            <Pressable onPress={onSelect}>
              {({ pressed }) => (
                <View
                  style={{
                    opacity: pressed ? 0.985 : 1,
                    transform: [{ scale: pressed ? 0.997 : 1 }],
                  }}
                >
                  {content}
                </View>
              )}
            </Pressable>
          )
        : content}

      {canCancel
        ? (
            <XStack justifyContent="flex-end">
              <AppButton buttonSize="compact" onPress={onCancel} tone="ghost">Hủy</AppButton>
            </XStack>
          )
        : null}
    </AppCard>
  );
}
