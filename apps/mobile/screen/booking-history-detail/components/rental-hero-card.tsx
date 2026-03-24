import { IconSymbol } from "@components/IconSymbol";
import { colors } from "@theme/colors";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { StatusBadge } from "@ui/primitives/status-badge";
import { View } from "react-native";
import { XStack, YStack } from "tamagui";

import type { Rental } from "@/types/rental-types";

import { softCardShadowStyle } from "../card-shadow";
import {
  formatCurrencyText,
  formatDateOnly,
  getDurationParts,
} from "../helpers/formatters";

type RentalHeroCardProps = {
  rental: Rental;
};

function getRentalStatusMeta(status: Rental["status"]) {
  if (status === "RENTED") {
    return {
      label: "ĐANG THUÊ",
      tone: "warning" as const,
      pulseDot: true,
    };
  }

  if (status === "COMPLETED") {
    return {
      label: "HOÀN THÀNH",
      tone: "success" as const,
      pulseDot: false,
    };
  }

  return {
    label: status,
    tone: "neutral" as const,
    pulseDot: false,
  };
}

export function RentalHeroCard({ rental }: RentalHeroCardProps) {
  const status = getRentalStatusMeta(rental.status);
  const duration = getDurationParts(rental.duration);

  return (
    <View style={softCardShadowStyle}>
      <AppCard borderRadius="$5" elevated={false} overflow="hidden" padding="$0">
        <XStack
          alignItems="center"
          borderBottomWidth={1}
          borderColor="$divider"
          justifyContent="space-between"
          padding="$5"
        >
          <StatusBadge
            label={status.label}
            pulseDot={status.pulseDot}
            tone={status.tone}
          />
          <AppText tone="muted" variant="value">
            {formatDateOnly(rental.startTime)}
          </AppText>
        </XStack>

        <YStack alignItems="center" overflow="hidden" padding="$6" position="relative">
          <View
            style={{
              position: "absolute",
              right: -16,
              top: -12,
              opacity: 0.05,
            }}
          >
            <IconSymbol color={colors.textSecondary} name="clock" size={144} />
          </View>

          <AppText tone="subtle" variant="eyebrow">
            Thời lượng
          </AppText>

          <XStack alignItems="flex-end" gap="$2" paddingTop="$4">
            <XStack alignItems="flex-end" gap="$1.5">
              <AppText tone="brand" variant="metricValue">
                {duration.hours}
              </AppText>
              <AppText tone="muted" variant="headline">
                giờ
              </AppText>
            </XStack>

            <XStack alignItems="flex-end" gap="$1.5">
              <AppText tone="brand" variant="metricValue">
                {duration.minutes}
              </AppText>
              <AppText tone="muted" variant="headline">
                phút
              </AppText>
            </XStack>
          </XStack>

          <XStack
            alignItems="center"
            backgroundColor="$surfaceMuted"
            borderRadius="$round"
            gap="$2"
            marginTop="$5"
            paddingHorizontal="$5"
            paddingVertical="$3"
          >
            <AppText tone="muted" variant="subhead">
              Tổng tiền:
            </AppText>
            <AppText tone="success" variant="headline">
              {formatCurrencyText(rental.totalPrice, rental.subscriptionId)}
            </AppText>
          </XStack>
        </YStack>
      </AppCard>
    </View>
  );
}
