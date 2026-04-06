import { Pressable } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";

import type { BikeSwapRequestDetail } from "@/types/rental-types";

import { IconSymbol } from "@/components/IconSymbol";
import { AppCard } from "@/ui/primitives/app-card";
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
    <Pressable
      onPress={() => onPress(request.id)}
      style={({ pressed }) => ({
        opacity: pressed ? 0.985 : 1,
        transform: [{ scale: pressed ? 0.996 : 1 }],
      })}
    >
      <AppCard borderRadius={32} chrome="whisper" gap="$3" padding="$4">
        <XStack alignItems="flex-start" gap="$3" justifyContent="space-between">
          <XStack alignItems="center" flex={1} gap="$3">
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

            <YStack flex={1} gap="$1">
              <AppText numberOfLines={1} variant="bodyStrong">
                {request.user.fullName}
              </AppText>
              <AppText tone="muted" variant="bodySmall">
                {formatBikeSwapDateTime(request.createdAt)}
              </AppText>
            </YStack>
          </XStack>

          <StatusBadge
            label={status.label}
            pulseDot={status.pulseDot}
            size="compact"
            tone={status.tone}
          />
        </XStack>
        {/*
        <XStack
          alignItems="center"
          backgroundColor="$surfaceMuted"
          borderColor="$borderSubtle"
          borderRadius={22}
          borderWidth={1}
          gap="$2"
          paddingHorizontal="$3"
          paddingVertical="$3"
        >
          <IconSymbol color={theme.textTertiary.val} name="bicycle" size={18} />
          <AppText flex={1} tone="muted" variant="body">
            Báo lỗi xe:
            {" "}
            <AppText tone="default" variant="bodyStrong">
              {request.oldBike.chipId}
            </AppText>
          </AppText>
          <IconSymbol color={theme.textTertiary.val} name="chevron.right" size={18} />
        </XStack> */}
      </AppCard>
    </Pressable>
  );
}
