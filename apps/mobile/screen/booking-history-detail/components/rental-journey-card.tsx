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
  timeText?: string;
  helperText?: string;
  iconName: "location" | "location.fill";
  iconColor: string;
  iconBackground: string;
  valueTone?: "default" | "warning" | "danger";
  isLast?: boolean;
  lineColor?: string;
  timeTone?: "muted" | "warning" | "danger";
};

function JourneyPoint({
  label,
  value,
  timeText,
  helperText,
  iconName,
  iconColor,
  iconBackground,
  valueTone = "default",
  isLast = false,
  lineColor = colors.warning,
  timeTone = "muted",
}: JourneyPointProps) {
  return (
    <XStack gap="$4">
      <YStack alignItems="center" width={56}>
        <YStack
          alignItems="center"
          backgroundColor={iconBackground}
          borderRadius="$round"
          height={56}
          justifyContent="center"
          shadowColor="$shadowColor"
          shadowOffset={{ width: 0, height: 4 }}
          shadowOpacity={0.06}
          shadowRadius={10}
          width={56}
        >
          <IconSymbol color={iconColor} name={iconName} size={22} />
        </YStack>
        {isLast
          ? null
          : (
              <View
                style={{
                  width: 3,
                  flex: 1,
                  marginTop: 8,
                  marginBottom: 8,
                  backgroundColor: lineColor,
                  opacity: 0.22,
                }}
              />
            )}
      </YStack>

      <YStack flex={1} gap="$1.5" paddingTop="$1">
        <AppText tone="subtle" variant="eyebrow">
          {label}
        </AppText>
        <AppText tone={valueTone} variant="headline">
          {value}
        </AppText>
        {timeText
          ? (
              <XStack alignItems="center" gap="$2">
                <IconSymbol color={colors.textSecondary} name="clock" size={14} />
                <AppText tone={timeTone} variant="bodySmall">
                  {timeText}
                </AppText>
              </XStack>
            )
          : null}
        {helperText
          ? (
              <AppText marginTop="$1" tone="muted" variant="bodySmall">
                {helperText}
              </AppText>
            )
          : null}
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
      : undefined
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
            lineColor={hasReturnSlot ? colors.warning : colors.info}
            timeText={formatTimeOnly(rental.startTime)}
            value={startStationLabel}
          />

          <JourneyPoint
            iconBackground={hasReturnSlot ? colors.warningSoft : colors.surfaceAccent}
            iconColor={hasReturnSlot ? colors.warning : colors.brandPrimary}
            iconName="location"
            helperText={isOngoing && !hasReturnSlot ? "Bạn cần chọn bãi trả trước khi kết thúc hành trình" : undefined}
            isLast
            label={hasReturnSlot ? "Trạm trả xe (đã đặt)" : "Trạm kết thúc"}
            timeText={endTimeLabel}
            timeTone={hasReturnSlot ? "warning" : isOngoing ? "muted" : "muted"}
            value={endStationLabel}
            valueTone={hasReturnSlot ? "warning" : isOngoing ? "danger" : "default"}
          />
        </AppCard>
      </View>
    </YStack>
  );
}
