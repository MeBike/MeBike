import { IconSymbol } from "@components/IconSymbol";
import { Field } from "@ui/primitives/field";
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
    <Field
      description={canEdit
        ? "Nhập ID trạm để áp dụng khung giờ cố định."
        : isEditMode
          ? "Khung giờ này chỉ chỉnh sửa trên đúng trạm đã tạo."
          : undefined}
      label="Trạm áp dụng"
    >
      {canEdit
        ? (
            <YStack gap="$2">
              <AppInput
                value={stationId}
                onChangeText={onChangeStationId}
                placeholder="Nhập ID trạm"
                leadingIcon={<IconSymbol color={theme.textSecondary.val} name="location" size="input" />}
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
              <XStack alignItems="flex-start" gap="$3" justifyContent="space-between">
                <YStack flex={1} gap="$1">
                  <AppText numberOfLines={2} variant="cardTitle">
                    {resolvedStationName ?? "Trạm chưa xác định"}
                  </AppText>
                  {stationId
                    ? (
                        <AppText numberOfLines={1} tone="subtle" variant="meta">
                          ID: {stationId}
                        </AppText>
                      )
                    : null}
                </YStack>
                <XStack
                  alignItems="center"
                  backgroundColor="$surfaceAccent"
                  borderRadius="$round"
                  paddingHorizontal="$3"
                  paddingVertical="$2"
                >
                  <AppText tone="brand" variant="caption">Đã khóa trạm</AppText>
                </XStack>
              </XStack>
            </AppCard>
          )}
    </Field>
  );
}
