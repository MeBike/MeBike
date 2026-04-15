import DateTimePicker from "@react-native-community/datetimepicker";
import { AppBottomModalCard } from "@ui/patterns/app-bottom-modal-card";
import { AppButton } from "@ui/primitives/app-button";
import { AppText } from "@ui/primitives/app-text";
import React from "react";
import { View } from "react-native";
import { XStack, YStack } from "tamagui";

import { formatTime } from "../editor-utils";

export type TimePickerModalProps = {
  visible: boolean;
  value: Date;
  onChange: (event: any, date?: Date) => void;
  onConfirm: () => void;
  onClose: () => void;
};

export function TimePickerModal({ visible, value, onChange, onConfirm, onClose }: TimePickerModalProps) {
  return (
    <AppBottomModalCard isVisible={visible} maxHeight="56%" onClose={onClose} variant="sheet">
      <YStack gap="$5" padding="$5">
        <YStack gap="$1">
          <AppText variant="sectionTitle">Chọn giờ bắt đầu</AppText>
          <AppText tone="muted" variant="bodySmall">
            Giờ này sẽ áp dụng cho toàn bộ ngày đã chọn.
          </AppText>
        </YStack>
        <View>
          <DateTimePicker
            mode="time"
            display="spinner"
            value={value}
            is24Hour
            onChange={onChange}
          />
        </View>
        <AppText tone="muted" variant="bodySmall">
          Giờ đã chọn:
          {formatTime(value)}
        </AppText>
        <XStack gap="$3" justifyContent="flex-end">
          <AppButton buttonSize="compact" onPress={onClose} tone="ghost">Đóng</AppButton>
          <AppButton buttonSize="compact" onPress={onConfirm} tone="primary">Chọn</AppButton>
        </XStack>
      </YStack>
    </AppBottomModalCard>
  );
}
