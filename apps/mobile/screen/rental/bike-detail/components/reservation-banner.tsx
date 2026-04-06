import { IconSymbol } from "@components/IconSymbol";
import { borderWidths } from "@theme/metrics";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { formatVietnamDateTime } from "@utils/date";
import React from "react";
import { Pressable } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";

import type { BikeDetailNavigationProp } from "@/types/navigation";
import type { Reservation } from "@/types/reservation-types";

export function ReservationBanner({
  reservation,
  navigation,
}: {
  reservation: Reservation;
  navigation: BikeDetailNavigationProp;
}) {
  const theme = useTheme();

  return (
    <AppCard elevated={false} style={{ borderRadius: 24 }} tone="accent">
      <YStack gap="$3">
        <XStack alignItems="center" gap="$3" justifyContent="space-between">
          <YStack flex={1} gap="$1">
            <AppText tone="brand" variant="bodyStrong">
              Bạn đang giữ xe này
            </AppText>
            <AppText tone="muted" variant="bodySmall">
              Bắt đầu lúc
              {" "}
              {formatVietnamDateTime(reservation.startTime)}
            </AppText>
          </YStack>

          <IconSymbol color={theme.actionPrimary.val} name="calendar" size="md" />
        </XStack>

        <Pressable
          accessibilityRole="button"
          onPress={() =>
            navigation.navigate("ReservationDetail", {
              reservationId: reservation.id,
              reservation,
            })}
          style={({ pressed }) => ({
            alignSelf: "flex-start",
            borderWidth: borderWidths.subtle,
            borderColor: theme.borderSubtle.val,
            borderRadius: 999,
            paddingHorizontal: 14,
            paddingVertical: 10,
            backgroundColor: theme.surfaceDefault.val,
            opacity: pressed ? 0.88 : 1,
          })}
        >
          <XStack alignItems="center" gap="$2">
            <AppText tone="brand" variant="bodyStrong">
              Xem chi tiết giữ xe
            </AppText>
            <IconSymbol color={theme.actionPrimary.val} name="arrow-right" size="sm" />
          </XStack>
        </Pressable>
      </YStack>
    </AppCard>
  );
}
