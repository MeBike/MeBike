import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";

import type { Rental } from "@/types/rental-types";

import { IconSymbol } from "@components/IconSymbol";
import { borderWidths, elevations } from "@theme/metrics";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { StatusBadge } from "@ui/primitives/status-badge";

import {
  formatCurrencyText,
  formatDateOnly,
  getDisplayDurationMinutes,
  getDurationParts,
} from "../helpers/formatters";

type RentalHeroCardProps = {
  rental: Rental;
  billingTotalAmount?: number;
  isBillingLoading?: boolean;
  onOpenBilling?: () => void;
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

export function RentalHeroCard({ billingTotalAmount, isBillingLoading, onOpenBilling, rental }: RentalHeroCardProps) {
  const theme = useTheme();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (rental.status !== "RENTED") {
      return;
    }

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [rental.status]);

  const status = getRentalStatusMeta(rental.status);
  const duration = getDurationParts(
    getDisplayDurationMinutes({
      status: rental.status,
      startTime: rental.startTime,
      duration: rental.duration,
      now,
    }),
  );
  const displayTotalAmount = billingTotalAmount ?? rental.totalPrice;
  const totalLabel = displayTotalAmount === undefined && isBillingLoading
    ? "Đang tính..."
    : formatCurrencyText(displayTotalAmount, rental.subscriptionId);

  return (
    <AppCard
      borderColor="$borderSubtle"
      borderRadius="$5"
      borderWidth={borderWidths.subtle}
      chrome="flat"
      overflow="hidden"
      padding="$0"
      style={elevations.whisper}
    >
      <XStack
        alignItems="center"
        backgroundColor="$surfaceMuted"
        borderBottomWidth={1}
        borderColor="$borderDefault"
        justifyContent="space-between"
        paddingHorizontal="$5"
        paddingVertical="$4"
      >
        <StatusBadge
          label={status.label}
          size="compact"
          pulseDot={status.pulseDot}
          tone={status.tone}
        />
        <AppText tone="muted" variant="meta">
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
          <IconSymbol color={theme.textSecondary.val} name="clock" size="splash" />
        </View>

        <AppText tone="subtle" variant="eyebrow">
          Thời lượng
        </AppText>

        <XStack alignItems="flex-end" gap="$2" paddingTop="$4">
          <XStack alignItems="flex-end" gap="$2">
            <AppText tone="brand" variant="metricValue">
              {duration.hours}
            </AppText>
            <AppText tone="muted" variant="headline">
              giờ
            </AppText>
          </XStack>

          <XStack alignItems="flex-end" gap="$2">
            <AppText tone="brand" variant="metricValue">
              {duration.minutes}
            </AppText>
            <AppText tone="muted" variant="headline">
              phút
            </AppText>
          </XStack>
        </XStack>

        <Pressable disabled={!onOpenBilling} onPress={onOpenBilling}>
          <XStack
            alignItems="center"
            backgroundColor="$surfaceMuted"
            borderColor={onOpenBilling ? "$borderDefault" : "transparent"}
            borderRadius="$round"
            borderWidth={onOpenBilling ? borderWidths.subtle : borderWidths.none}
            gap="$2"
            marginTop="$5"
            paddingHorizontal="$5"
            paddingVertical="$3"
          >
            <AppText tone="muted" variant="subhead">
              Tổng tiền:
            </AppText>
            <AppText tone="success" variant="headline">
              {totalLabel}
            </AppText>
            {onOpenBilling
              ? <IconSymbol color={theme.textTertiary.val} name="chevron-right" size="sm" />
              : null}
          </XStack>
        </Pressable>
      </YStack>
    </AppCard>
  );
}
