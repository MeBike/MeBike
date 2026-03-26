import { IconSymbol } from "@components/IconSymbol";
import { colors } from "@theme/colors";
import { borderWidths } from "@theme/metrics";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { formatVietnamDateTime } from "@utils/date";
import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { XStack, YStack } from "tamagui";

import type { BikeDetailNavigationProp } from "@/types/navigation";
import type { Reservation } from "@/types/reservation-types";

export function ReservationBanner({
  reservation,
  navigation,
}: {
  reservation: Reservation;
  navigation: BikeDetailNavigationProp;
}) {
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

          <IconSymbol color={colors.brandPrimary} name="calendar" size={20} />
        </XStack>

        <Pressable
          accessibilityRole="button"
          onPress={() =>
            navigation.navigate("ReservationDetail", {
              reservationId: reservation.id,
              reservation,
            })}
          style={({ pressed }) => [styles.actionButton, pressed ? styles.actionButtonPressed : null]}
        >
          <XStack alignItems="center" gap="$2">
            <AppText tone="brand" variant="bodyStrong">
              Xem chi tiết giữ xe
            </AppText>
            <IconSymbol color={colors.brandPrimary} name="arrow.right" size={16} />
          </XStack>
        </Pressable>
      </YStack>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignSelf: "flex-start",
    borderWidth: borderWidths.subtle,
    borderColor: colors.borderSubtle,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.surface,
  },
  actionButtonPressed: {
    opacity: 0.88,
  },
});
