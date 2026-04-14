import { IconSymbol } from "@components/IconSymbol";
import { Field } from "@ui/primitives/field";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import React from "react";
import { Pressable } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";

type Props = {
  slotStart: string;
  onSelectTime: () => void;
};

export function TimeSelectionSection({ slotStart, onSelectTime }: Props) {
  const theme = useTheme();

  return (
    <Field description="Giờ này sẽ áp dụng cho toàn bộ ngày đã chọn." label="Giờ bắt đầu">
      <Pressable onPress={onSelectTime}>
        {({ pressed }) => (
          <AppCard
            borderColor="$borderSubtle"
            borderWidth={1}
            chrome="flat"
            opacity={pressed ? 0.97 : 1}
            tone="accent"
          >
            <XStack alignItems="center" gap="$3" justifyContent="space-between">
              <XStack alignItems="center" flex={1} gap="$3">
                <XStack
                  alignItems="center"
                  backgroundColor="$surfaceDefault"
                  borderRadius="$round"
                  height={40}
                  justifyContent="center"
                  width={40}
                >
                  <IconSymbol color={theme.actionPrimary.val} name="clock" size="md" />
                </XStack>
                <YStack flex={1} gap="$1">
                  <AppText variant="bodyStrong">{slotStart}</AppText>
                  <AppText tone="muted" variant="caption">Nhấn để chọn lại thời gian</AppText>
                </YStack>
              </XStack>
              <IconSymbol color={theme.textTertiary.val} name="chevron-right" size="input" />
            </XStack>
          </AppCard>
        )}
      </Pressable>
    </Field>
  );
}
