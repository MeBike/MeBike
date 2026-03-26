import { IconSymbol } from "@components/IconSymbol";
import { radii } from "@theme/metrics";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { StatusBadge } from "@ui/primitives/status-badge";
import { formatVietnamDateTime } from "@utils/date";
import { formatDurationMinutes } from "@utils/duration";
import { formatSupportCode } from "@utils/id";
import { memo, useMemo } from "react";
import { Pressable } from "react-native";
import { Separator, useTheme, XStack, YStack } from "tamagui";

import type { Rental, RentalStatus } from "@/types/rental-types";

type BookingCardProps = {
  booking: Rental;
  stationNameById: Map<string, string>;
  onPress: (bookingId: string) => void;
};

const BookingCard = memo(({ booking, stationNameById, onPress }: BookingCardProps) => {
  const theme = useTheme();
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

  const status = getStatusMeta(booking.status, theme);

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
              backgroundColor="$surfaceMuted"
              borderRadius="$round"
              height={44}
              justifyContent="center"
              width={44}
            >
              <IconSymbol color={theme.textSecondary.val} name="bicycle.circle.fill" size={20} />
            </YStack>
            <YStack flex={1} gap="$1">
              <AppText variant="subhead">
                Xe đạp
              </AppText>
              <AppText tone="subtle" variant="meta">
                {formatSupportCode(booking.id)}
              </AppText>
            </YStack>
          </XStack>

          <YStack alignItems="flex-end" gap="$2">
            <AppText tone="brand" variant="priceValue">
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

        <Separator borderColor="$borderDefault" />

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
              backgroundColor={theme.surfaceDefault.val}
              borderColor={theme.textTertiary.val}
              borderRadius="$round"
              borderWidth={1.5}
              height={18}
              justifyContent="center"
              width={18}
            >
              <YStack backgroundColor={theme.textTertiary.val} borderRadius="$round" height={4} width={4} />
            </YStack>

            <YStack
              backgroundColor={theme.borderSubtle.val}
              borderRadius="$round"
              flex={1}
              marginVertical={4}
              width={2}
            />

            <YStack
              alignItems="center"
              backgroundColor={theme.surfaceDefault.val}
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
              <AppText flex={1} numberOfLines={1} variant="compactStrong">
                {originLabel}
              </AppText>
            </XStack>

            <XStack alignItems="center" minHeight={18}>
              <AppText
                flex={1}
                numberOfLines={1}
                tone={status.destinationTone}
                variant="compactStrong"
              >
                {destinationLabel}
              </AppText>
            </XStack>
          </YStack>
        </XStack>

        <XStack alignItems="center" gap="$3" paddingHorizontal="$1">
          <XStack alignItems="center" gap="$2" flex={1}>
            <IconSymbol color={theme.textTertiary.val} name="calendar" size={14} />
            <AppText tone="muted" variant="bodySmall">
              {formatVietnamDateTime(booking.startTime)}
            </AppText>
          </XStack>
          <Separator alignSelf="stretch" borderColor="$borderDefault" vertical />
          <XStack alignItems="center" gap="$2" flex={1}>
            <IconSymbol color={theme.textTertiary.val} name="clock" size={14} />
            <AppText tone="muted" variant="bodySmall">
              {formatDurationMinutes(booking.duration, { hasEnded: Boolean(booking.endTime) })}
            </AppText>
          </XStack>
        </XStack>
      </AppCard>
    </Pressable>
  );
});

function getStatusMeta(status: RentalStatus, theme: ReturnType<typeof useTheme>) {
  switch (status) {
    case "COMPLETED":
      return {
        label: "HOÀN THÀNH",
        tone: "success" as const,
        pulseDot: false,
        withDot: false,
        destinationTone: "default" as const,
        routeAccentColor: theme.actionPrimary.val,
      };
    case "RENTED":
      return {
        label: "ĐANG THUÊ",
        tone: "warning" as const,
        pulseDot: true,
        withDot: true,
        destinationTone: "warning" as const,
        routeAccentColor: theme.statusWarning.val,
      };
    case "CANCELLED":
      return {
        label: "ĐÃ HỦY",
        tone: "danger" as const,
        pulseDot: false,
        withDot: false,
        destinationTone: "danger" as const,
        routeAccentColor: theme.statusDanger.val,
      };
    default:
      return {
        label: status,
        tone: "neutral" as const,
        pulseDot: false,
        withDot: false,
        destinationTone: "default" as const,
        routeAccentColor: theme.textSecondary.val,
      };
  }
}

export default BookingCard;
