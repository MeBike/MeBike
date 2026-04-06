import { IconSymbol } from "@components/IconSymbol";
import { radii } from "@theme/metrics";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { StatusBadge } from "@ui/primitives/status-badge";
import { formatVietnamDateTime } from "@utils/date";
import {
  getReservationOptionLabel,
  getReservationStatusLabel,
  getReservationStatusTone,
} from "@utils/reservation";
import React from "react";
import { Pressable, View } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";

import type { Reservation } from "@/types/reservation-types";

import { formatCurrency } from "../../../utils/reservation-screen-utils";

type ReservationCardProps = {
  reservation: Reservation;
  stationName?: string;
  onPress: () => void;
};

function splitFormattedDateTime(value?: string | null) {
  const formatted = value ? formatVietnamDateTime(value) : "--";
  const [date = formatted, time] = formatted.split(" ");
  return {
    date,
    time: time ?? undefined,
  };
}

function getReservationTitle(reservation: Reservation) {
  if (reservation.bikeId) {
    return `Xe #${String(reservation.bikeId).slice(-4)}`;
  }

  return "Chỗ trống tại trạm";
}

function getReservationStatusIcon(status: Reservation["status"]) {
  if (status === "PENDING") {
    return "check-circle" as const;
  }

  return undefined;
}

export function ReservationCard({
  reservation,
  stationName,
  onPress,
}: ReservationCardProps) {
  const theme = useTheme();
  const createdAt = splitFormattedDateTime(reservation.createdAt);
  const startTime = splitFormattedDateTime(reservation.startTime);
  const endTime = splitFormattedDateTime(reservation.endTime);
  const statusTone = getReservationStatusTone(reservation.status);
  const isPending = reservation.status === "PENDING";
  const statusIcon = getReservationStatusIcon(reservation.status);
  const cardTitle = getReservationTitle(reservation);
  const createdAtLabel = createdAt.time ? `${createdAt.time} ${createdAt.date}` : createdAt.date;
  const timeRangeLabel = `${startTime.time ?? startTime.date} đến ${endTime.time ?? "--:--"}`;
  const stationLabel = stationName ?? reservation.station?.name ?? "Không xác định";
  const titleLineCount = reservation.bikeId ? 1 : 2;

  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <View
          style={{
            opacity: pressed ? 0.98 : 1,
            shadowColor: theme.shadowColor.val,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.08,
            shadowRadius: 20,
            elevation: 4,
          }}
        >
          <AppCard borderRadius={radii.xxl} elevated={false} overflow="hidden" padding="$0">
            <YStack>
              <XStack alignItems="flex-start" gap="$3" justifyContent="space-between" padding="$4" paddingBottom="$3">
                <XStack alignItems="center" flex={1} gap="$3">
                  <XStack
                    alignItems="center"
                    backgroundColor="$surfaceAccent"
                    borderRadius="$round"
                    height={56}
                    justifyContent="center"
                    width={56}
                  >
                    <IconSymbol
                      color={theme.actionPrimary.val}
                      name={reservation.bikeId ? "bike" : "location"}
                      size="lg"
                    />
                  </XStack>

                  <YStack flex={1} gap="$1" justifyContent="center" minWidth={0} paddingRight="$2">
                    <AppText numberOfLines={titleLineCount} variant="cardTitle">
                      {cardTitle}
                    </AppText>
                    <AppText numberOfLines={1} tone="subtle" variant="meta">
                      {createdAtLabel}
                    </AppText>
                  </YStack>
                </XStack>

                <XStack alignSelf="flex-start" flexShrink={0}>
                  <StatusBadge
                    iconName={statusIcon}
                    label={getReservationStatusLabel(reservation.status)}
                    pulseDot={isPending}
                    size="compact"
                    tone={statusTone}
                    withDot={reservation.status !== "FULFILLED" && reservation.status !== "EXPIRED"}
                  />
                </XStack>
              </XStack>

              <YStack
                backgroundColor={theme.surfaceMuted.val}
                gap="$4"
                paddingHorizontal="$5"
                paddingVertical="$4"
              >
                <XStack alignItems="center" gap="$3">
                  <IconSymbol color={theme.textTertiary.val} name="location" size="md" />
                  <AppText flex={1} numberOfLines={2} variant="subhead">
                    {stationLabel}
                  </AppText>
                </XStack>

                <XStack alignItems="flex-start" gap="$3">
                  <IconSymbol color={theme.textTertiary.val} name="clock" size="md" style={{ marginTop: 1 }} />
                  <YStack flex={1} gap="$1">
                    <AppText variant="subhead">
                      {timeRangeLabel}
                    </AppText>
                    <AppText tone="subtle" variant="meta">
                      {startTime.date}
                    </AppText>
                  </YStack>
                </XStack>

                <XStack alignItems="center" gap="$3">
                  <IconSymbol color={theme.textTertiary.val} name="tag" size="md" />
                  <AppText tone="muted" variant="bodySmall">
                    {getReservationOptionLabel(reservation.reservationOption)}
                  </AppText>
                </XStack>

                <XStack alignItems="center" gap="$3">
                  <IconSymbol color={theme.actionPrimary.val} name="wallet" size="md" />
                  <AppText tone="muted" variant="bodySmall">
                    Đã thanh toán:
                    {" "}
                    <AppText tone="brand" variant="bodyStrong">
                      {formatCurrency(reservation.prepaid)}
                    </AppText>
                  </AppText>
                </XStack>
              </YStack>
            </YStack>
          </AppCard>
        </View>
      )}
    </Pressable>
  );
}
