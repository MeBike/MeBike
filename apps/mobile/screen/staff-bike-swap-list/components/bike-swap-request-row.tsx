import { useTheme, YStack } from "tamagui";

import type { BikeSwapRequestDetail } from "@/types/rental-types";

import { IconSymbol } from "@/components/IconSymbol";
import { AppCard } from "@/ui/primitives/app-card";
import { AppListRow } from "@/ui/primitives/app-list-row";
import { AppText } from "@/ui/primitives/app-text";
import { StatusBadge } from "@/ui/primitives/status-badge";

import { formatBikeSwapDateTime, getBikeSwapStatusMeta } from "../../staff-bike-swap/shared";

type BikeSwapRequestRowProps = {
  onPress: (bikeSwapRequestId: string) => void;
  request: BikeSwapRequestDetail;
};

export function BikeSwapRequestRow({ onPress, request }: BikeSwapRequestRowProps) {
  const theme = useTheme();
  const status = getBikeSwapStatusMeta(request.status);

  return (
    <AppCard borderRadius={32} chrome="whisper" overflow="hidden" padding="$0">
      <AppListRow
        leading={(
          <YStack
            alignItems="center"
            backgroundColor="$surfaceAccent"
            borderRadius="$round"
            height={48}
            justifyContent="center"
            width={48}
          >
            <IconSymbol color={theme.textBrand.val} name="person" size={22} />
          </YStack>
        )}
        onPress={() => onPress(request.id)}
        primary={(
          <AppText numberOfLines={1} variant="bodyStrong">
            {request.user.fullName}
          </AppText>
        )}
        secondary={(
          <AppText tone="muted" variant="bodySmall">
            {formatBikeSwapDateTime(request.createdAt)}
          </AppText>
        )}
        trailing={(
          <StatusBadge
            label={status.label}
            pulseDot={status.pulseDot}
            size="compact"
            tone={status.tone}
          />
        )}
      />
    </AppCard>
  );
}
