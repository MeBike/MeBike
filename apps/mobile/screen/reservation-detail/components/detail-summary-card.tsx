import React from "react";
import { View } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";

import type { Reservation } from "@/types/reservation-types";

import { formatCurrency } from "@/utils/reservation-screen-utils";
import { IconSymbol } from "@components/IconSymbol";
import { spaceScale } from "@theme/metrics";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { StatusBadge } from "@ui/primitives/status-badge";
import { getReservationStatusLabel, getReservationStatusTone } from "@utils/reservation";

import {
  formatReservationDateTime,
  getReservationIdentityIcon,
  getReservationIdentityTitle,
} from "../helpers/formatters";
import { DetailRow } from "./detail-row";

type DetailSummaryCardProps = {
  reservation: Reservation;
  stationName?: string;
  stationAddress?: string;
};

function getStatusIcon(status: Reservation["status"]) {
  if (status === "PENDING") {
    return "clock" as const;
  }

  return undefined;
}

export function DetailSummaryCard({
  reservation,
  stationName,
  stationAddress,
}: DetailSummaryCardProps) {
  const theme = useTheme();
  const isPending = reservation.status === "PENDING";
  const statusIcon = getStatusIcon(reservation.status);
  const title = getReservationIdentityTitle(reservation);
  const holdTime = formatReservationDateTime(reservation.startTime);
  const holdExpiry = reservation.endTime
    ? `Hiệu lực đến ${formatReservationDateTime(reservation.endTime)}`
    : "Không giới hạn";
  const createdAt = formatReservationDateTime(reservation.createdAt);

  return (
    <View
      style={{
        shadowColor: theme.shadowColor.val,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 5,
      }}
    >
      <AppCard borderRadius={24} elevated={false} overflow="hidden" padding="$0">
        <YStack>
          <YStack gap="$4" paddingTop="$6" paddingHorizontal="$6" paddingBottom="$5">
            <XStack alignItems="center" gap="$4">
              <XStack
                alignItems="center"
                backgroundColor="$surfaceAccent"
                borderRadius="$round"
                height={64}
                justifyContent="center"
                width={64}
              >
                <IconSymbol
                  color={theme.actionPrimary.val}
                  name={getReservationIdentityIcon(reservation)}
                  size="chip"
                />
              </XStack>

              <YStack flex={1} gap="$2">
                <AppText
                  numberOfLines={2}
                  variant="headline"
                >
                  {title}
                </AppText>

                <StatusBadge
                  iconName={statusIcon}
                  label={getReservationStatusLabel(reservation.status).toUpperCase()}
                  pulseDot={isPending}
                  size="compact"
                  tone={getReservationStatusTone(reservation.status)}
                  withDot={reservation.status !== "FULFILLED" && reservation.status !== "EXPIRED"}
                />
              </YStack>
            </XStack>

          </YStack>

          <View style={{ height: 1, marginHorizontal: spaceScale[6], backgroundColor: theme.surfaceMuted.val }} />

          <YStack gap="$7" paddingTop="$6" paddingHorizontal="$6" paddingBottom="$7">
            <DetailRow
              iconName="clock"
              label="Thời gian giữ chỗ"
              secondaryValue={holdExpiry}
              value={holdTime}
            />

            <DetailRow
              iconName="location"
              label="Trạm lấy xe"
              secondaryValue={stationAddress}
              value={stationName ?? "Không xác định"}
            />

            <DetailRow
              highlightValue
              iconName="wallet"
              label="Số tiền đã thanh toán"
              value={formatCurrency(reservation.prepaid)}
            />

            <DetailRow
              iconName="calendar"
              label="Tạo lúc"
              value={createdAt}
            />
          </YStack>
        </YStack>
      </AppCard>
    </View>
  );
}
