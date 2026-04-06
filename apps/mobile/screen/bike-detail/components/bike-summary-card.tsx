import { IconSymbol } from "@components/IconSymbol";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { StatusBadge } from "@ui/primitives/status-badge";
import React from "react";
import { useTheme, XStack, YStack } from "tamagui";

import type { BikeSummary } from "@/contracts/server";

import { createBikeDetailTextStyles } from "../text-styles";

function shortId(value: string, options?: { head?: number; tail?: number }) {
  const head = options?.head ?? 8;
  const tail = options?.tail ?? 4;

  if (!value || value.length <= head + tail + 1) {
    return value;
  }

  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

function formatChipValue(value: string) {
  if (!value) {
    return "Chưa cập nhật";
  }

  return value.length > 16 ? shortId(value, { head: 8, tail: 4 }) : value;
}

function getStatusTone(status: BikeSummary["status"]) {
  switch (status) {
    case "AVAILABLE":
      return "success" as const;
    case "RESERVED":
    case "BOOKED":
      return "warning" as const;
    case "BROKEN":
    case "MAINTAINED":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
}

function getStatusLabel(status: BikeSummary["status"]) {
  switch (status) {
    case "AVAILABLE":
      return "Có sẵn";
    case "RESERVED":
      return "Đặt trước";
    case "BOOKED":
      return "Đang thuê";
    case "BROKEN":
      return "Bị hỏng";
    case "MAINTAINED":
      return "Bảo trì";
    default:
      return "Không khả dụng";
  }
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof IconSymbol>["name"];
  label: string;
  value: string;
}) {
  const theme = useTheme();
  const bikeDetailTextStyles = createBikeDetailTextStyles(theme);

  return (
    <XStack alignItems="center" gap="$3" justifyContent="space-between">
      <XStack alignItems="center" flex={1} gap="$2">
        <IconSymbol color={theme.textTertiary.val} name={icon} size="sm" />
        <AppText style={{ flex: 1, ...bikeDetailTextStyles.detailLabel }}>{label}</AppText>
      </XStack>

      <AppText
        flexShrink={1}
        maxWidth="54%"
        numberOfLines={1}
        style={bikeDetailTextStyles.detailValue}
      >
        {value}
      </AppText>
    </XStack>
  );
}

export function BikeSummaryCard({
  bike,
  stationName,
}: {
  bike: BikeSummary;
  stationName: string;
}) {
  const theme = useTheme();
  const bikeDetailTextStyles = createBikeDetailTextStyles(theme);
  const hasRatings = bike.rating.totalRatings > 0;

  return (
    <AppCard borderRadius="$5" padding="$5">
      <YStack gap="$4">
        <XStack alignItems="flex-start" gap="$4">
          <XStack
            alignItems="center"
            backgroundColor="$surfaceAccent"
            borderRadius="$round"
            height={64}
            justifyContent="center"
            width={64}
          >
            <IconSymbol color={theme.actionPrimary.val} name="bicycle" size="feature" />
          </XStack>

          <YStack flex={1} gap="$2">
            <XStack alignItems="flex-start" gap="$3" justifyContent="space-between">
              <YStack flex={1} gap="$1">
                <AppText style={bikeDetailTextStyles.cardTitle}>Xe đạp</AppText>
                <AppText style={bikeDetailTextStyles.cardSubtitle}>
                  #
                  {shortId(bike.id)}
                </AppText>
              </YStack>

              <StatusBadge
                label={getStatusLabel(bike.status)}
                pulseDot={bike.status === "AVAILABLE"}
                size="compact"
                tone={getStatusTone(bike.status)}
              />
            </XStack>

            <XStack alignItems="center" gap="$1">
              <IconSymbol color={theme.statusWarning.val} name="star.fill" size="caption" />
              {hasRatings
                ? (
                    <>
                      <AppText style={bikeDetailTextStyles.ratingValue}>{bike.rating.averageRating.toFixed(1)}</AppText>
                      <AppText style={bikeDetailTextStyles.ratingMeta}>
                        (
                        {bike.rating.totalRatings}
                        {" "}
                        đánh giá)
                      </AppText>
                    </>
                  )
                : <AppText style={bikeDetailTextStyles.ratingMeta}>Mới</AppText>}
            </XStack>
          </YStack>
        </XStack>

        <XStack backgroundColor="$borderSubtle" height={1} width="100%" />

        <YStack gap="$3">
          <DetailRow icon="location" label="Trạm hiện tại" value={stationName} />
          <DetailRow icon="number" label="Nhà cung cấp" value={bike.supplier?.name ?? "Chưa cập nhật"} />
          <DetailRow icon="cpu" label="Mã vi mạch" value={formatChipValue(bike.chipId)} />
        </YStack>
      </YStack>
    </AppCard>
  );
}
