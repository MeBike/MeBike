import { IconSymbol } from "@components/IconSymbol";
import { colors } from "@theme/colors";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { View } from "react-native";
import { XStack, YStack } from "tamagui";

import type { MyRentalResolvedDetail } from "@/types/rental-types";

import { softCardShadowStyle } from "../card-shadow";
import { formatTimeOnly } from "../helpers/formatters";

type RentalJourneyCardProps = {
  detail: MyRentalResolvedDetail;
};

type JourneyPointProps = {
  label: string;
  value: string;
  timeText: string;
  iconName: "location" | "location.fill";
  iconColor: string;
  iconBackground: string;
  valueTone?: "default" | "warning" | "danger";
  isLast?: boolean;
  lineColor?: string;
};

function JourneyPoint({
  label,
  value,
  timeText,
  iconName,
  iconColor,
  iconBackground,
  valueTone = "default",
  isLast = false,
  lineColor = colors.warning,
}: JourneyPointProps) {
  return (
    <XStack gap="$4">
      <YStack alignItems="center" width={44}>
        <YStack
          alignItems="center"
          backgroundColor={iconBackground}
          borderRadius="$round"
          height={40}
          justifyContent="center"
          width={40}
        >
          <IconSymbol color={iconColor} name={iconName} size={18} />
        </YStack>
        {isLast
          ? null
          : (
              <View
                style={{
                  width: 2,
                  flex: 1,
                  marginTop: 6,
                  marginBottom: 6,
                  backgroundColor: lineColor,
                  opacity: 0.3,
                }}
              />
            )}
      </YStack>

      <YStack flex={1} gap="$1" paddingTop="$1">
        <AppText tone="subtle" variant="eyebrow">
          {label}
        </AppText>
        <AppText tone={valueTone} variant="headline">
          {value}
        </AppText>
        <XStack alignItems="center" gap="$2">
          <IconSymbol color={colors.textSecondary} name="clock" size={14} />
          <AppText tone={valueTone === "warning" ? "warning" : "muted"} variant="bodySmall">
            {timeText}
          </AppText>
        </XStack>
      </YStack>
    </XStack>
  );
}

export function RentalJourneyCard({ detail }: RentalJourneyCardProps) {
  const { rental, startStation, endStation, returnSlot, returnStation } = detail;
  const isOngoing = rental.status === "RENTED";
  const hasReturnSlot = isOngoing && Boolean(returnSlot);

  const startStationLabel = startStation?.name ?? "Không xác định";
  const endStationLabel = isOngoing
    ? hasReturnSlot
      ? (returnStation?.name ?? "Bãi trả đã chọn")
      : "Chưa chọn bãi trả"
    : (endStation?.name ?? "Không xác định");

  const endTimeLabel = isOngoing
    ? hasReturnSlot
      ? `Giữ chỗ từ ${formatTimeOnly(returnSlot?.reservedFrom)}`
      : "Bạn cần chọn bãi trả trước khi kết thúc hành trình"
    : formatTimeOnly(rental.endTime);

  return (
    <YStack gap="$3">
      <XStack alignItems="center" gap="$2">
        <IconSymbol color={colors.textSecondary} name="map" size={18} />
        <AppText variant="sectionTitle">
          Hành trình
        </AppText>
      </XStack>

      <View style={softCardShadowStyle}>
        <AppCard borderRadius="$5" elevated={false} gap="$5" padding="$5">
          <JourneyPoint
            iconBackground={colors.successSoft}
            iconColor={colors.success}
            iconName="location.fill"
            label="Trạm bắt đầu"
            lineColor={hasReturnSlot ? colors.warning : colors.brandPrimary}
            timeText={formatTimeOnly(rental.startTime)}
            value={startStationLabel}
          />

          <JourneyPoint
            iconBackground={hasReturnSlot ? colors.warningSoft : colors.surfaceAccent}
            iconColor={hasReturnSlot ? colors.warning : colors.brandPrimary}
            iconName="location"
            isLast
            label={hasReturnSlot ? "Trạm trả xe (đã đặt)" : "Trạm kết thúc"}
            timeText={endTimeLabel}
            value={endStationLabel}
            valueTone={hasReturnSlot ? "warning" : isOngoing ? "danger" : "default"}
          />
        </AppCard>
      </View>
    </YStack>
  );
}
