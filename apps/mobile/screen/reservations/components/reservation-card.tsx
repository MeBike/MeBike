import { IconSymbol } from "@components/IconSymbol";
import { colors } from "@theme/colors";
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
import { XStack, YStack } from "tamagui";

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
  if (status === "ACTIVE") {
    return "checkmark.circle" as const;
  }

  return undefined;
}

export function ReservationCard({
  reservation,
  stationName,
  onPress,
}: ReservationCardProps) {
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
            shadowColor: colors.shadowColor,
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
                      color={colors.brandPrimary}
                      name={reservation.bikeId ? "bicycle" : "location"}
                      size={24}
                    />
                  </XStack>

                  <YStack flex={1} gap="$1" justifyContent="center" minWidth={0} paddingRight="$2">
                    <AppText
                      numberOfLines={titleLineCount}
                      variant="sectionTitle"
                      style={{ fontWeight: "800", letterSpacing: -0.3, lineHeight: 21 }}
                    >
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
                backgroundColor={colors.surfaceMuted}
                gap="$4"
                paddingHorizontal="$5"
                paddingVertical="$4"
              >
                <XStack alignItems="center" gap="$3">
                  <IconSymbol color={colors.textMuted} name="location" size={20} />
                  <AppText flex={1} numberOfLines={2} variant="bodyStrong" style={{ fontWeight: "700", lineHeight: 22 }}>
                    {stationLabel}
                  </AppText>
                </XStack>

                <XStack alignItems="flex-start" gap="$3">
                  <IconSymbol color={colors.textMuted} name="clock" size={20} style={{ marginTop: 1 }} />
                  <YStack flex={1} gap="$1">
                    <AppText variant="bodyStrong" style={{ fontWeight: "700", lineHeight: 22 }}>
                      {timeRangeLabel}
                    </AppText>
                    <AppText tone="subtle" variant="meta">
                      {startTime.date}
                    </AppText>
                  </YStack>
                </XStack>

                <XStack alignItems="center" gap="$3">
                  <IconSymbol color={colors.textMuted} name="tag" size={20} />
                  <AppText tone="muted" variant="bodySmall">
                    {getReservationOptionLabel(reservation.reservationOption)}
                  </AppText>
                </XStack>

                <XStack alignItems="center" gap="$3">
                  <IconSymbol color={colors.brandPrimary} name="wallet.pass.fill" size={20} />
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
