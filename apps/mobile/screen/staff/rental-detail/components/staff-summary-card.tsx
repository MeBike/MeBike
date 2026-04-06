import { borderWidths, elevations } from "@theme/metrics";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { shortenId } from "@utils/id";
import { useEffect, useState } from "react";
import { useTheme, XStack, YStack } from "tamagui";

import type { RentalDetail } from "@/types/rental-types";

import { IconSymbol } from "@/components/IconSymbol";

import {
  formatTimeOnly,
  getDurationParts,
  getPaymentLabel,
} from "../../../rental/booking-history-detail/helpers/formatters";

type StaffSummaryCardProps = {
  booking: RentalDetail;
};

function formatStartDateCompact(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).format(date);
}

function formatDurationInline(hours: number, minutes: number) {
  if (hours > 0) {
    return `${hours} giờ ${minutes} phút`;
  }

  return `${minutes} phút`;
}

export function StaffSummaryCard({ booking }: StaffSummaryCardProps) {
  const theme = useTheme();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (booking.status !== "RENTED") {
      return;
    }

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 30000);

    return () => clearInterval(interval);
  }, [booking.startTime, booking.status]);

  const activeDurationMinutes = booking.status === "RENTED"
    ? Math.max(0, Math.floor((now - new Date(booking.startTime).getTime()) / 60000))
    : booking.duration;
  const duration = getDurationParts(activeDurationMinutes);
  const rentalCode = shortenId(booking.id.replace(/^RENT-/i, ""), { head: 6, tail: 4 }).toUpperCase();
  const paymentValue = `${(booking.totalPrice ?? 0).toLocaleString("vi-VN")} đ`;
  const durationLabel = formatDurationInline(duration.hours, duration.minutes);

  return (
    <YStack gap="$3">
      <AppCard
        borderColor="$borderSubtle"
        borderRadius="$5"
        borderWidth={borderWidths.subtle}
        chrome="flat"
        padding="$5"
        style={elevations.whisper}
      >
        <XStack justifyContent="space-between" gap="$4">
          <YStack flex={1} justifyContent="space-between" minHeight={56}>
            <AppText tone="subtle" variant="meta">
              Mã phiên
            </AppText>
            <AppText variant="subhead">
              {rentalCode}
            </AppText>
          </YStack>

          <YStack alignItems="flex-end" flex={1} justifyContent="space-between" minHeight={56}>
            <AppText tone="subtle" variant="meta">
              Bắt đầu lúc
            </AppText>
            <AppText align="right" variant="subhead">
              {formatTimeOnly(booking.startTime)}
              {" "}
              {formatStartDateCompact(booking.startTime)}
            </AppText>
          </YStack>
        </XStack>
      </AppCard>

      <AppCard
        borderColor="$borderSubtle"
        borderRadius="$5"
        borderWidth={borderWidths.subtle}
        chrome="flat"
        overflow="hidden"
        padding="$0"
        style={elevations.whisper}
      >
        <XStack alignItems="center" gap="$4" padding="$5">
          <YStack
            alignItems="center"
            backgroundColor="$surfaceAccent"
            borderRadius="$round"
            height={60}
            justifyContent="center"
            width={60}
          >
            <IconSymbol color={theme.textBrand.val} name="timer" size="lg" />
          </YStack>

          <YStack flex={1} gap="$1">
            <AppText tone="subtle" variant="meta">
              Thời lượng
            </AppText>
            <AppText numberOfLines={1} variant="sectionTitle">
              {durationLabel}
            </AppText>
          </YStack>
        </XStack>

        <YStack borderTopColor="$borderSubtle" borderTopWidth={borderWidths.subtle}>
          <XStack alignItems="center" gap="$4" padding="$5">
            <YStack
              alignItems="center"
              backgroundColor="$surfaceSuccess"
              borderRadius="$round"
              height={60}
              justifyContent="center"
              width={60}
            >
              <IconSymbol color={theme.statusSuccess.val} name="credit-card" size="lg" />
            </YStack>

            <YStack flex={1} gap="$1">
              <AppText tone="subtle" variant="meta">
                Thanh toán
              </AppText>
              <AppText numberOfLines={1} variant="sectionTitle">
                {paymentValue}
              </AppText>
              <AppText tone="muted" variant="bodySmall">
                {getPaymentLabel(booking.subscriptionId)}
              </AppText>
            </YStack>
          </XStack>
        </YStack>
      </AppCard>
    </YStack>
  );
}
