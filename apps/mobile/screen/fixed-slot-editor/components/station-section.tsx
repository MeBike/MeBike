import { IconSymbol } from "@components/IconSymbol";
import { AppCard } from "@ui/primitives/app-card";
import { AppInput } from "@ui/primitives/app-input";
import { AppText } from "@ui/primitives/app-text";
import React from "react";
import { useTheme, XStack, YStack } from "tamagui";

type Props = {
  stationId: string;
  stationName?: string;
  resolvedStationName?: string;
  canEdit: boolean;
  isEditMode: boolean;
  onChangeStationId: (value: string) => void;
};

export function StationSection({
  stationId,
  stationName,
  resolvedStationName,
  canEdit,
  isEditMode,
  onChangeStationId,
}: Props) {
  const theme = useTheme();

  return (
    <YStack gap="$2">
      <AppText tone="muted" variant="eyebrow">Trạm nhận xe</AppText>
      {canEdit
        ? (
            <YStack gap="$2">
              <AppInput
                value={stationId}
                onChangeText={onChangeStationId}
                placeholder="Nhập ID trạm"
                leadingIcon={<IconSymbol color={theme.actionPrimary.val} name="location" size="input" />}
              />
              {stationName
                ? (
                    <AppText tone="muted" variant="caption">
                      Gợi ý: {stationName}
                      {stationId ? ` (ID: ${stationId})` : ""}
                    </AppText>
                  )
                : null}
            </YStack>
          )
        : (
            <AppCard borderColor="$borderSubtle" borderWidth={1} chrome="flat" gap="$3" tone="muted">
              <XStack alignItems="center" gap="$3" justifyContent="space-between">
                <XStack alignItems="center" flex={1} gap="$2">
                  <IconSymbol color={theme.actionPrimary.val} name="location" size="input" />
                  <AppText flex={1} numberOfLines={1} variant="bodyStrong">
                    {resolvedStationName ?? stationName ?? "Chưa chọn trạm"}
                  </AppText>
                </XStack>
                <IconSymbol color={theme.textTertiary.val} name="chevron-right" size="sm" />
              </XStack>
              {stationId
                ? (
                    <AppText numberOfLines={1} tone="subtle" variant="meta">
                      ID: {stationId}
                    </AppText>
                  )
                : null}
              {isEditMode
                ? <AppText tone="muted" variant="caption">Chỉ chỉnh sửa trên trạm đã tạo khung giờ này.</AppText>
                : null}
            </AppCard>
          )}
    </YStack>
  );
}
