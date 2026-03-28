import React from "react";
import { View } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";

import type { Reservation } from "@/types/reservation-types";

import { formatCurrency } from "@/utils/reservation-screen-utils";
import { IconSymbol } from "@components/IconSymbol";
import { radii } from "@theme/metrics";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { StatusBadge } from "@ui/primitives/status-badge";
import { getReservationStatusLabel, getReservationStatusTone } from "@utils/reservation";

import {
  formatReservationDateTime,
  getReservationIdentityIcon,
  getReservationIdentityTitle,
  getShortReservationId,
} from "../helpers/formatters";
import { DetailRow } from "./detail-row";

type DetailSummaryCardProps = {
  reservation: Reservation;
  stationName?: string;
  stationAddress?: string;
};

function getStatusIcon(status: Reservation["status"]) {
  if (status === "ACTIVE") {
    return "checkmark.circle" as const;
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
  const shortReservationId = getShortReservationId(reservation.id);
  const holdTime = formatReservationDateTime(reservation.startTime);
  const holdExpiry = reservation.endTime
    ? `Hiệu lực đến ${formatReservationDateTime(reservation.endTime)}`
    : "Không giới hạn";
  const createdAt = formatReservationDateTime(reservation.createdAt);
  const updatedAt = `Cập nhật gần nhất ${formatReservationDateTime(reservation.updatedAt)}`;

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
      <AppCard borderRadius={radii.xxl} elevated={false} overflow="hidden" padding="$0">
        <YStack>
          <XStack alignItems="flex-start" gap="$4" justifyContent="space-between" padding="$6">
            <XStack flex={1} gap="$4">
              <XStack
                alignItems="center"
                backgroundColor="$surfaceAccent"
                borderRadius="$round"
                height={60}
                justifyContent="center"
                width={60}
              >
                <IconSymbol
                  color={theme.actionPrimary.val}
                  name={getReservationIdentityIcon(reservation)}
                  size={26}
                />
              </XStack>

              <YStack flex={1} gap="$3" paddingTop="$1">
                <XStack alignItems="flex-start" gap="$3" justifyContent="space-between">
                  <AppText
                    flex={1}
                    numberOfLines={2}
                    variant="headline"
                  >
                    {title}
                  </AppText>

                  <YStack paddingTop="$1">
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

                <XStack alignItems="center" gap="$2" paddingRight="$2">
                  <AppText tone="muted" variant="bodySmall">
                    Mã đặt:
                    {" "}
                    {shortReservationId}
                  </AppText>
                  <IconSymbol color={theme.textTertiary.val} name="doc.on.doc" size={14} />
                </XStack>
              </YStack>
            </XStack>
          </XStack>

          <View style={{ height: 1, backgroundColor: theme.surfaceMuted.val }} />

          <YStack gap="$7" padding="$6">
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
              iconName="wallet.pass.fill"
              label="Số tiền đã thanh toán"
              value={formatCurrency(reservation.prepaid)}
            />

            <DetailRow
              iconName="calendar"
              label="Tạo lúc"
              secondaryValue={updatedAt}
              value={createdAt}
            />
          </YStack>
        </YStack>
      </AppCard>
    </View>
  );
}
