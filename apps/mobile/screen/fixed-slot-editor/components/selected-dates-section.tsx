import { IconSymbol } from "@components/IconSymbol";
import { AppButton } from "@ui/primitives/app-button";
import { AppCard } from "@ui/primitives/app-card";
import { AppListRow } from "@ui/primitives/app-list-row";
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
    <AppCard borderColor="$borderSubtle" borderWidth={1} chrome="flat" gap="$4">
      <XStack alignItems="center" gap="$3" justifyContent="space-between">
        <YStack flex={1} gap="$1">
          <AppText variant="sectionTitle">Ngày áp dụng</AppText>
          <AppText tone="muted" variant="caption">
            Chỉ chọn các ngày bắt đầu từ ngày mai để đảm bảo chuẩn bị.
          </AppText>
        </YStack>
        <AppButton buttonSize="compact" onPress={onAddDate} tone="soft">Thêm ngày</AppButton>
      </XStack>

      {pastDatesHidden > 0
        ? (
            <AppText tone="muted" variant="caption">
              Đã ẩn {pastDatesHidden} ngày cũ khỏi danh sách.
            </AppText>
          )
        : null}

      {selectedDates.length === 0
        ? (
            <AppCard chrome="flat" tone="muted">
              <AppText tone="muted" variant="bodySmall">Bạn chưa chọn ngày nào.</AppText>
            </AppCard>
          )
        : (
            <AppCard chrome="flat" padding="$0" tone="muted">
              <YStack>
                {selectedDates.map((date, index) => (
                  <AppListRow
                    key={date}
                    showDivider={index < selectedDates.length - 1}
                    dividerInset="$4"
                    leading={<IconSymbol color={theme.textTertiary.val} name="calendar" size="md" />}
                    primary={<AppText variant="bodyStrong">{formatDateLabel(date)}</AppText>}
                    secondary={<AppText tone="subtle" variant="meta">{date}</AppText>}
                    trailing={(
                      <Pressable onPress={() => onRemoveDate(date)}>
                        {({ pressed }) => (
                          <XStack opacity={pressed ? 0.7 : 1} padding="$1">
                            <IconSymbol color={theme.textDanger.val} name="close" size="input" />
                          </XStack>
                        )}
                      </Pressable>
                    )}
                  />
                ))}
              </YStack>
            </AppCard>
          )}
    </AppCard>
  );
}
