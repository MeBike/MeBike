import { StatusBadge } from "@ui/primitives/status-badge";
import { AppText } from "@ui/primitives/app-text";
import { XStack, YStack } from "tamagui";
import { presentFixedSlotStatus } from "@/presenters/fixed-slots/fixed-slot-presenter";
import { getFixedSlotStatusTone } from "@/presenters/fixed-slots/fixed-slot-presenter";

import type { FixedSlotStatus } from "@/contracts/server";

type Props = {
  name?: string | null;
  stationId?: string | null;
  status: FixedSlotStatus;
};

export function StationSummary({ name, stationId, status }: Props) {
  const statusLabel = presentFixedSlotStatus(status);
  const statusTone = getFixedSlotStatusTone(status);

  return (
    <YStack gap="$3">
      <XStack alignItems="flex-start" gap="$3" justifyContent="space-between">
        <YStack flex={1} gap="$1">
          <AppText numberOfLines={2} variant="cardTitle">{name ?? "Không xác định"}</AppText>
          {stationId
            ? (
                <AppText numberOfLines={1} tone="subtle" variant="meta">
                  ID: {stationId}
                </AppText>
              )
            : null}
        </YStack>
        <StatusBadge label={statusLabel} size="compact" tone={statusTone} withDot />
      </XStack>
    </YStack>
  );
}
