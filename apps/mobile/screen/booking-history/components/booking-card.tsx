import { IconSymbol } from "@components/IconSymbol";
import { colors } from "@theme/colors";
import { radii } from "@theme/metrics";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { StatusBadge } from "@ui/primitives/status-badge";
import { formatVietnamDateTime } from "@utils/date";
import { formatDurationMinutes } from "@utils/duration";
import { formatSupportCode } from "@utils/id";
import { memo, useMemo } from "react";
import { Pressable } from "react-native";
import { Separator, XStack, YStack } from "tamagui";

import type { Rental, RentalStatus } from "@/types/rental-types";

type BookingCardProps = {
  booking: Rental;
  stationNameById: Map<string, string>;
  onPress: (bookingId: string) => void;
};

const BookingCard = memo(({ booking, stationNameById, onPress }: BookingCardProps) => {
  const priceText = useMemo(() => {
    const total = booking.totalPrice ?? 0;
    return `${total.toLocaleString("vi-VN")} đ`;
  }, [booking.totalPrice]);

  const originLabel = useMemo(
    () => stationNameById.get(booking.startStation) ?? formatSupportCode(booking.startStation),
    [booking.startStation, stationNameById],
  );
  const destinationLabel = useMemo(() => {
    if (!booking.endStation) {
      return "Đang di chuyển...";
    }

    return stationNameById.get(booking.endStation) ?? formatSupportCode(booking.endStation);
  }, [booking.endStation, stationNameById]);

  const status = getStatusMeta(booking.status);

  return (
    <Pressable
      onPress={() => onPress(booking.id)}
      style={({ pressed }) => ({ opacity: pressed ? 0.98 : 1 })}
    >
      <AppCard borderRadius={radii.xl} gap="$4" padding="$4">
        <XStack alignItems="flex-start" justifyContent="space-between" gap="$3">
          <XStack flex={1} gap="$3">
            <YStack
              alignItems="center"
              backgroundColor={colors.surfaceMuted}
              borderRadius="$round"
              height={44}
              justifyContent="center"
              width={44}
            >
              <IconSymbol color={colors.textSecondary} name="bicycle.circle.fill" size={20} />
            </YStack>
            <YStack flex={1} gap="$1">
              <AppText style={{ fontSize: 17, fontWeight: "700", lineHeight: 22 }}>
                Xe đạp
              </AppText>
              <AppText tone="subtle" variant="bodySmall">
                {formatSupportCode(booking.id)}
              </AppText>
            </YStack>
          </XStack>

          <YStack alignItems="flex-end" gap="$2">
            <AppText style={{ color: colors.brandPrimary, fontSize: 19, fontWeight: "800", lineHeight: 24 }}>
              {priceText}
            </AppText>
            <StatusBadge
              label={status.label}
              pulseDot={status.pulseDot}
              size="compact"
              tone={status.tone}
              withDot={status.withDot}
            />
          </YStack>
        </XStack>

        <Separator borderColor="$divider" />

        <XStack alignItems="stretch" gap="$3" paddingHorizontal="$1">
          <YStack
            alignItems="center"
            alignSelf="stretch"
            justifyContent="space-between"
            paddingVertical={2}
            width={20}
          >
            <YStack
              alignItems="center"
              backgroundColor={colors.surface}
              borderColor={colors.textMuted}
              borderRadius="$round"
              borderWidth={1.5}
              height={18}
              justifyContent="center"
              width={18}
            >
              <YStack backgroundColor={colors.textMuted} borderRadius="$round" height={4} width={4} />
            </YStack>

            <YStack
              backgroundColor={colors.borderSubtle}
              borderRadius="$round"
              flex={1}
              marginVertical={4}
              width={2}
            />

            <YStack
              alignItems="center"
              backgroundColor={colors.surface}
              borderColor={status.routeAccentColor}
              borderRadius="$round"
              borderWidth={1.5}
              height={18}
              justifyContent="center"
              width={18}
            >
              <YStack
                backgroundColor={status.routeAccentColor}
                borderRadius="$round"
                height={6}
                width={6}
              />
            </YStack>
          </YStack>

          <YStack flex={1} justifyContent="space-between" minHeight={56} paddingVertical={2}>
            <XStack alignItems="center" minHeight={18}>
              <AppText flex={1} numberOfLines={1} style={{ fontSize: 15, fontWeight: "700", lineHeight: 18 }}>
                {originLabel}
              </AppText>
            </XStack>

            <XStack alignItems="center" minHeight={18}>
              <AppText
                flex={1}
                numberOfLines={1}
                style={{ fontSize: 15, fontWeight: "700", lineHeight: 18 }}
                tone={status.destinationTone}
              >
                {destinationLabel}
              </AppText>
            </XStack>
          </YStack>
        </XStack>

        <XStack alignItems="center" gap="$3" paddingHorizontal="$1">
          <XStack alignItems="center" gap="$1.5" flex={1}>
            <IconSymbol color={colors.textMuted} name="calendar" size={14} />
            <AppText tone="muted" variant="bodySmall">
              {formatVietnamDateTime(booking.startTime)}
            </AppText>
          </XStack>
          <Separator alignSelf="stretch" borderColor="$divider" vertical />
          <XStack alignItems="center" gap="$1.5" flex={1}>
            <IconSymbol color={colors.textMuted} name="clock" size={14} />
            <AppText tone="muted" variant="bodySmall">
              {formatDurationMinutes(booking.duration, { hasEnded: Boolean(booking.endTime) })}
            </AppText>
          </XStack>
        </XStack>
      </AppCard>
    </Pressable>
  );
});

function getStatusMeta(status: RentalStatus) {
  switch (status) {
    case "COMPLETED":
      return {
        label: "HOÀN THÀNH",
        tone: "success" as const,
        pulseDot: false,
        withDot: false,
        destinationTone: "default" as const,
        routeAccentColor: colors.brandPrimary,
      };
    case "RENTED":
      return {
        label: "ĐANG THUÊ",
        tone: "warning" as const,
        pulseDot: true,
        withDot: true,
        destinationTone: "warning" as const,
        routeAccentColor: colors.warning,
      };
    case "CANCELLED":
      return {
        label: "ĐÃ HỦY",
        tone: "danger" as const,
        pulseDot: false,
        withDot: false,
        destinationTone: "danger" as const,
        routeAccentColor: colors.error,
      };
    case "RESERVED":
      return {
        label: "ĐÃ ĐẶT",
        tone: "neutral" as const,
        pulseDot: false,
        withDot: false,
        destinationTone: "default" as const,
        routeAccentColor: colors.brandPrimary,
      };
    default:
      return {
        label: status,
        tone: "neutral" as const,
        pulseDot: false,
        withDot: false,
        destinationTone: "default" as const,
        routeAccentColor: colors.textSecondary,
      };
  }
}

export default BookingCard;
