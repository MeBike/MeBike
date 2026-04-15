import DateTimePicker from "@react-native-community/datetimepicker";
import { AppBottomModalCard } from "@ui/patterns/app-bottom-modal-card";
import { AppButton } from "@ui/primitives/app-button";
import { AppText } from "@ui/primitives/app-text";
import React from "react";
import { View } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";

import { getTomorrowDate } from "../editor-utils";

type Props = {
  visible: boolean;
  value: Date;
  onChange: (event: any, date?: Date) => void;
  onConfirm: () => void;
  onClose: () => void;
};

export function DatePickerModal({ visible, value, onChange, onConfirm, onClose }: Props) {
  const theme = useTheme();

  return (
    <AppBottomModalCard isVisible={visible} maxHeight="60%" onClose={onClose} variant="sheet">
      <YStack gap="$5" padding="$5">
        <YStack gap="$1">
          <AppText variant="sectionTitle">Chọn ngày áp dụng</AppText>
          <AppText tone="muted" variant="bodySmall">
            Chỉ hỗ trợ các ngày từ ngày mai trở đi.
          </AppText>
        </YStack>
        <View>
          <DateTimePicker
            mode="date"
            display="spinner"
            value={value}
            accentColor={theme.actionPrimary.val}
            minimumDate={getTomorrowDate()}
            onChange={onChange}
          />
        </View>
        <XStack gap="$3" justifyContent="flex-end">
          <AppButton buttonSize="compact" onPress={onClose} tone="ghost">Đóng</AppButton>
          <AppButton buttonSize="compact" onPress={onConfirm} tone="primary">Chọn</AppButton>
        </XStack>
      </YStack>
    </AppBottomModalCard>
  );
}
