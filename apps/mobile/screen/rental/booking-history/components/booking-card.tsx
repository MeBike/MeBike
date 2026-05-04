import { IconSymbol } from "@components/IconSymbol";
import { borderWidths, radii, spaceScale } from "@theme/metrics";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { StatusBadge } from "@ui/primitives/status-badge";
import { formatBikeNumber } from "@utils/bike";
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
      if (booking.status === "OVERDUE_UNRETURNED") {
        return "Quá hạn";
      }

      return "Đang di chuyển...";
    }

    return stationNameById.get(booking.endStation) ?? formatSupportCode(booking.endStation);
  }, [booking.endStation, booking.status, stationNameById]);

  const status = getStatusMeta(booking.status, theme);

  return (
    <Pressable
      onPress={() => onPress(booking.id)}
      style={({ pressed }) => ({ opacity: pressed ? 0.98 : 1 })}
    >
      <AppCard borderRadius={radii.xl} gap="$4" padding="$4">
        <XStack alignItems="center" gap="$3">
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
            <XStack alignItems="center" justifyContent="space-between" gap="$3">
              <AppText flex={1} numberOfLines={1} variant="cardTitle">
                Xe đạp
              </AppText>
              <AppText style={{ fontVariant: ["tabular-nums"] }} variant="headline">
                {priceText}
              </AppText>
            </XStack>

            <XStack alignItems="center" justifyContent="space-between" gap="$3">
              <AppText flex={1} numberOfLines={1} tone="muted" variant="bodySmall">
                {formatBikeNumber(booking.bikeNumber, booking.bikeId)}
              </AppText>
              <StatusBadge
                label={status.label}
                pulseDot={status.pulseDot}
                size="compact"
                tone={status.tone}
                withDot={status.withDot}
              />
            </XStack>
          </YStack>
        </XStack>

        <YStack gap="$5" paddingTop="$1" position="relative">
          <YStack
            backgroundColor={theme.borderDefault.val}
            borderRadius="$round"
            bottom={routeNodeSize}
            left={(routeColumnWidth - routeStemWidth) / 2}
            position="absolute"
            top={routeNodeSize}
            width={routeStemWidth}
          />

          <XStack alignItems="center" gap="$3">
            <YStack alignItems="center" width={routeColumnWidth}>
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
            </YStack>

            <AppText flex={1} numberOfLines={1} variant="subhead">
              {originLabel}
            </AppText>
          </XStack>

          <XStack alignItems="center" gap="$3">
            <YStack alignItems="center" width={routeColumnWidth}>
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
    case "OVERDUE_UNRETURNED":
      return {
        label: "QUÁ HẠN",
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
