import { IconSymbol } from "@components/IconSymbol";
import { borderWidths, radii, spaceScale } from "@theme/metrics";
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

const bookingIconShellSize = spaceScale[9];
const routeColumnWidth = spaceScale[5];
const routeNodeSize = spaceScale[2] + spaceScale[1];
const routeInnerDotSize = spaceScale[1];
const routeStemWidth = borderWidths.strong;

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
              height={bookingIconShellSize}
              justifyContent="center"
              width={bookingIconShellSize}
            >
              <IconSymbol color={theme.textSecondary.val} name="bike" size="md" />
            </YStack>
            <YStack flex={1} gap="$1">
              <AppText variant="cardTitle">
                Xe đạp
              </AppText>
              <AppText tone="muted" variant="bodySmall">
                {formatSupportCode(booking.bikeId)}
              </AppText>
            </YStack>
          </XStack>

          <YStack alignItems="flex-end" gap="$2">
            <AppText style={{ fontVariant: ["tabular-nums"] }} variant="headline">
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

        <XStack alignItems="stretch" gap="$3" paddingTop="$1">
          <YStack
            alignItems="center"
            alignSelf="stretch"
            justifyContent="space-between"
            paddingVertical="$1"
            width={routeColumnWidth}
          >
            <YStack
              alignItems="center"
              backgroundColor={theme.surfaceDefault.val}
              borderColor={theme.borderStrong.val}
              borderRadius="$round"
              borderWidth={1.5}
              height={routeNodeSize}
              justifyContent="center"
              width={routeNodeSize}
            >
              <YStack backgroundColor={theme.borderStrong.val} borderRadius="$round" height={routeInnerDotSize} width={routeInnerDotSize} />
            </YStack>

            <YStack
              backgroundColor={theme.borderDefault.val}
              borderRadius="$round"
              flex={1}
              marginVertical="$1"
              width={routeStemWidth}
            />

            <YStack
              alignItems="center"
              backgroundColor={theme.surfaceDefault.val}
              borderColor={status.routeAccentColor}
              borderRadius="$round"
              borderWidth={1.5}
              height={routeNodeSize}
              justifyContent="center"
              width={routeNodeSize}
            >
              <YStack
                backgroundColor={status.routeAccentColor}
                borderRadius="$round"
                height={routeInnerDotSize}
                width={routeInnerDotSize}
              />
            </YStack>
          </YStack>

          <YStack flex={1} gap="$5" justifyContent="space-between" minHeight={spaceScale[10]} paddingVertical="$1">
            <XStack alignItems="center" minHeight={routeNodeSize}>
              <AppText flex={1} numberOfLines={1} variant="subhead">
                {originLabel}
              </AppText>
            </XStack>

            <XStack alignItems="center" minHeight={routeNodeSize}>
              <AppText
                flex={1}
                numberOfLines={1}
                tone={status.destinationTone}
                variant="subhead"
              >
                {destinationLabel}
              </AppText>
            </XStack>
          </YStack>
        </XStack>

        <Separator borderColor="$backgroundSubtle" />

        <XStack alignItems="center" gap="$4" justifyContent="space-between">
          <XStack alignItems="center" gap="$2" flex={1}>
            <IconSymbol color={theme.textTertiary.val} name="calendar" size="caption" />
            <AppText tone="muted" variant="bodySmall">
              {formatVietnamDateTime(booking.startTime)}
            </AppText>
          </XStack>

          <XStack alignItems="center" gap="$2" justifyContent="flex-end" flex={1}>
            <IconSymbol color={theme.textTertiary.val} name="clock" size="caption" />
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
