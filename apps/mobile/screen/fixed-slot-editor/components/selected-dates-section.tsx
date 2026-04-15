import { IconSymbol } from "@components/IconSymbol";
import { AppButton } from "@ui/primitives/app-button";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import React from "react";
import { Pressable } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";

import { formatDateLabel } from "../editor-utils";

type Props = {
  selectedDates: string[];
  pastDatesHidden: number;
  onAddDate: () => void;
  onRemoveDate: (date: string) => void;
};

export function SelectedDatesSection({ selectedDates, pastDatesHidden, onAddDate, onRemoveDate }: Props) {
  const theme = useTheme();

  return (
    <YStack gap="$2">
      <AppText variant="label">Chọn các ngày cần đặt</AppText>
      <AppCard borderColor="$borderSubtle" borderWidth={1} chrome="flat" gap="$4">
        <YStack flex={1} gap="$1">
          <AppText tone="muted" variant="bodySmall">
            Chọn các ngày trong tương lai bạn muốn sử dụng xe.
          </AppText>
        </YStack>

        <XStack flexWrap="wrap" gap="$2">
          {selectedDates.map(date => (
            <XStack
              key={date}
              alignItems="center"
              backgroundColor="$surfaceAccent"
              borderColor="$borderFocus"
              borderRadius="$3"
              borderWidth={1}
              gap="$2"
              paddingHorizontal="$3"
              paddingVertical="$2"
            >
              <AppText tone="brand" variant="badgeLabel">{formatDateLabel(date)}</AppText>
              <Pressable onPress={() => onRemoveDate(date)}>
                {({ pressed }) => (
                  <XStack opacity={pressed ? 0.7 : 1}>
                    <IconSymbol color={theme.textBrand.val} name="close" size="caption" />
                  </XStack>
                )}
              </Pressable>
            </XStack>
          ))}

          <AppButton buttonSize="compact" onPress={onAddDate} tone="ghost">
            + Thêm ngày
          </AppButton>
        </XStack>

        {selectedDates.length === 0
          ? <AppText tone="muted" variant="bodySmall">Bạn chưa chọn ngày nào.</AppText>
          : null}

        {pastDatesHidden > 0
          ? (
              <AppText tone="muted" variant="caption">
                Đã ẩn
                {" "}
                {pastDatesHidden}
                {" "}
                ngày cũ khỏi danh sách.
              </AppText>
            )
          : null}
      </AppCard>
    </YStack>
  );
}
