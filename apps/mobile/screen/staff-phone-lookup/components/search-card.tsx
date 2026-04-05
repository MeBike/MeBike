import React from "react";
import { useTheme, YStack } from "tamagui";

import { IconSymbol } from "@/components/IconSymbol";
import { AppButton } from "@/ui/primitives/app-button";
import { AppCard } from "@/ui/primitives/app-card";
import { AppInput } from "@/ui/primitives/app-input";
import { AppText } from "@/ui/primitives/app-text";

export function SearchCard({
  phoneNumber,
  onPhoneChange,
  onLookup,
  isPending,
  isDisabled,
  summary,
}: {
  phoneNumber: string;
  onPhoneChange: (value: string) => void;
  onLookup: () => void;
  isPending: boolean;
  isDisabled: boolean;
  summary: string | null;
}) {
  const theme = useTheme();

  return (
    <AppCard borderRadius="$4" chrome="whisper" gap="$4" padding="$4">
      <YStack gap="$1">
        <AppText variant="bodyStrong">Tìm kiếm khách hàng</AppText>
        <AppText tone="muted" variant="bodySmall">
          Nhập số điện thoại để lấy danh sách phiên thuê đang hoạt động khi khách không thể quét mã QR.
        </AppText>
      </YStack>

      <AppInput
        leadingIcon={<IconSymbol color={theme.textSecondary.val} name="magnifyingglass" size={18} />}
        keyboardType="phone-pad"
        maxLength={15}
        onChangeText={onPhoneChange}
        onSubmitEditing={onLookup}
        placeholder="Ví dụ: 0912345678"
        value={phoneNumber}
      />

      <AppButton disabled={isDisabled} loading={isPending} onPress={onLookup} tone="primary">
        Tra cứu
      </AppButton>

      {summary
        ? (
            <AppText tone="muted" variant="bodySmall">
              {summary}
            </AppText>
          )
        : null}
    </AppCard>
  );
}
