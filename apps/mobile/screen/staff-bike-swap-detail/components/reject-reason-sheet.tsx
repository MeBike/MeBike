import React from "react";
import { Modal, Pressable } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";

import { IconSymbol } from "@/components/IconSymbol";
import { borderWidths, elevations, spaceScale } from "@/theme/metrics";
import { AppButton } from "@/ui/primitives/app-button";
import { AppCard } from "@/ui/primitives/app-card";
import { AppInput } from "@/ui/primitives/app-input";
import { AppText } from "@/ui/primitives/app-text";

type RejectReasonSheetProps = {
  isSubmitting: boolean;
  isVisible: boolean;
  onChangeVisible: (visible: boolean) => void;
  onReasonChange: (value: string) => void;
  onSubmit: () => void;
  reason: string;
};

export function RejectReasonSheet({
  isSubmitting,
  isVisible,
  onChangeVisible,
  onReasonChange,
  onSubmit,
  reason,
}: RejectReasonSheetProps) {
  const theme = useTheme();

  return (
    <Modal animationType="fade" onRequestClose={() => onChangeVisible(false)} transparent visible={isVisible}>
      <Pressable
        onPress={() => onChangeVisible(false)}
        style={{
          flex: 1,
          backgroundColor: "rgba(15, 23, 42, 0.35)",
          justifyContent: "flex-end",
        }}
      >
        <Pressable onPress={() => {}}>
          <AppCard borderRadius="$5" chrome="flat" gap="$5" margin="$4" padding="$0" style={elevations.medium}>
            <YStack gap="$4" padding="$6">
              <YStack
                alignItems="center"
                backgroundColor="$surfaceDanger"
                borderRadius="$round"
                height={52}
                justifyContent="center"
                width={52}
              >
                <IconSymbol color={theme.statusDanger.val} name="exclamationmark.triangle.fill" size={22} />
              </YStack>

              <YStack gap="$2">
                <AppText variant="sectionTitle">Từ chối đổi xe</AppText>
                <AppText tone="muted" variant="bodySmall">
                  Vui lòng nhập lý do từ chối để thông báo lại cho khách hàng.
                </AppText>
              </YStack>

              <YStack gap="$2">
                <AppText variant="subhead">Lý do từ chối</AppText>
                <AppInput
                  multiline
                  numberOfLines={4}
                  onChangeText={onReasonChange}
                  placeholder="Ví dụ: Hiện tại trạm đã hết xe khả dụng..."
                  style={{
                    minHeight: spaceScale[10] + spaceScale[4],
                    paddingTop: spaceScale[3],
                  }}
                  textAlignVertical="top"
                  value={reason}
                />
              </YStack>
            </YStack>

            <XStack
              backgroundColor="$backgroundSubtle"
              borderTopColor="$borderSubtle"
              borderTopWidth={borderWidths.subtle}
              gap="$3"
              padding="$4"
            >
              <AppButton flex={1} onPress={() => onChangeVisible(false)} tone="outline">
                Hủy
              </AppButton>
              <AppButton
                backgroundColor="$surfaceDanger"
                borderColor="$surfaceDanger"
                flex={1}
                loading={isSubmitting}
                onPress={onSubmit}
                pressStyle={{
                  backgroundColor: theme.surfaceDanger.val,
                  borderColor: theme.surfaceDanger.val,
                  opacity: 1,
                  scale: 0.985,
                }}
              >
                <AppText tone="danger" variant="bodyStrong">
                  Xác nhận
                </AppText>
              </AppButton>
            </XStack>
          </AppCard>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
