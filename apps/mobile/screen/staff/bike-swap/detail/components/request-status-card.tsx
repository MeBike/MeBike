import { XStack, YStack } from "tamagui";

import type { BikeSwapStatus } from "@/types/rental-types";

import { AppCard } from "@/ui/primitives/app-card";
import { AppText } from "@/ui/primitives/app-text";
import { StatusBadge } from "@/ui/primitives/status-badge";

import { formatBikeSwapDateTime, getBikeSwapStatusMeta } from "../../shared";

type RequestStatusCardProps = {
  createdAt: string;
  status: BikeSwapStatus;
};

export function RequestStatusCard({ createdAt, status }: RequestStatusCardProps) {
  const statusMeta = getBikeSwapStatusMeta(status);

  return (
    <AppCard borderRadius={32} chrome="whisper" padding="$4">
      <XStack alignItems="center" justifyContent="space-between" gap="$4">
        <YStack flex={1} gap="$2">
          <AppText tone="subtle" variant="eyebrow">
            Trạng thái
          </AppText>
          <StatusBadge
            label={statusMeta.label}
            pulseDot={statusMeta.pulseDot}
            size="compact"
            tone={statusMeta.tone}
          />
        </YStack>

        <YStack alignItems="flex-end" flex={1} gap="$2">
          <AppText tone="subtle" variant="eyebrow">
            Thời gian tạo
          </AppText>
          <AppText align="right" numberOfLines={1} variant="bodyStrong">
            {formatBikeSwapDateTime(createdAt)}
          </AppText>
        </YStack>
      </XStack>
    </AppCard>
  );
}
