import React from "react";
import { useTheme, XStack, YStack } from "tamagui";

import { IconSymbol } from "@/components/IconSymbol";
import { AppCard } from "@/ui/primitives/app-card";
import { AppText } from "@/ui/primitives/app-text";

export function EmptyState({ hasSearched = false }: { hasSearched?: boolean }) {
  const theme = useTheme();

  return (
    <AppCard alignItems="center" borderRadius="$4" chrome="whisper" gap="$3" padding="$5">
      <XStack alignItems="center" backgroundColor="$surfaceAccent" borderRadius="$round" height={56} justifyContent="center" width={56}>
        <IconSymbol color={theme.textBrand.val} name="magnifyingglass" size={24} />
      </XStack>

      <YStack gap="$1">
        <AppText align="center" variant="bodyStrong">
          {hasSearched ? "Không tìm thấy phiên thuê" : "Chưa có dữ liệu tra cứu"}
        </AppText>
        <AppText align="center" tone="muted" variant="bodySmall">
          {hasSearched
            ? "Khách hàng hiện không có phiên thuê nào đang hoạt động."
            : "Nhập số điện thoại của khách để kiểm tra phiên thuê đang hoạt động."}
        </AppText>
      </YStack>
    </AppCard>
  );
}
