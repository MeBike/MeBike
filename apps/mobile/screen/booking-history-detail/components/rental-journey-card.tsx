import { View } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";

import type { MyRentalResolvedDetail } from "@/types/rental-types";

import { LucideIconSymbol as IconSymbol } from "@components/lucide-icon-symbol";
import { borderWidths, elevations } from "@theme/metrics";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";

import { formatTimeOnly } from "../helpers/formatters";
import { BikeSwapRequestCard } from "./bike-swap-request-card";
import { IncidentRequestCard } from "./incident-request-card";

type RentalJourneyCardProps = {
  detail: MyRentalResolvedDetail;
  missingReturnSlotHelperText?: string;
  missingReturnSlotLabel?: string;
  reservedReturnStationLabel?: string;
  bikeSwapStatus?: "NONE" | "PENDING" | "CONFIRMED" | "REJECTED";
  confirmedBikeLabel?: string;
  bikeSwapRejectionReason?: string | null;
  onRequestBikeSwap?: () => void;
  isRequestBikeSwapDisabled?: boolean;
  showBikeSwapSection?: boolean;
  onReportIncident?: () => void;
  isReportIncidentDisabled?: boolean;
  showIncidentActionSection?: boolean;
  isReportingIncident?: boolean;
};

export type RentalJourneyViewProps = {
  startStationLabel: string;
  endStationLabel: string;
  startTimeText?: string;
  endTimeText?: string;
  isOngoing: boolean;
  hasReturnSlot: boolean;
  missingReturnSlotHelperText?: string;
  missingReturnSlotLabel?: string;
  reservedReturnStationLabel?: string;
  bikeSwapStatus?: "NONE" | "PENDING" | "CONFIRMED" | "REJECTED";
  confirmedBikeLabel?: string;
  bikeSwapRejectionReason?: string | null;
  onRequestBikeSwap?: () => void;
  isRequestBikeSwapDisabled?: boolean;
  showBikeSwapSection?: boolean;
  onReportIncident?: () => void;
  isReportIncidentDisabled?: boolean;
  showIncidentActionSection?: boolean;
  isReportingIncident?: boolean;
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
  clockColor: string;
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
  lineColor,
  timeTone = "muted",
  clockColor,
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

      <YStack flex={1} gap="$2" paddingTop="$1">
        <AppText tone="subtle" variant="eyebrow">
          {label}
        </AppText>
        <AppText tone={valueTone} variant="headline">
          {value}
        </AppText>
        {timeText
          ? (
              <XStack alignItems="center" gap="$2">
                <IconSymbol color={clockColor} name="clock" size={14} />
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

export function RentalJourneyView({
  startStationLabel,
  endStationLabel,
  startTimeText,
  endTimeText,
  isOngoing,
  hasReturnSlot,
  missingReturnSlotHelperText = "Bạn cần chọn bãi trả trước khi kết thúc hành trình",
  missingReturnSlotLabel = "Trạm kết thúc",
  reservedReturnStationLabel = "Trạm trả xe (đã đặt)",
  bikeSwapStatus = "NONE",
  confirmedBikeLabel,
  bikeSwapRejectionReason,
  onRequestBikeSwap,
  isRequestBikeSwapDisabled = false,
  showBikeSwapSection = true,
  onReportIncident,
  isReportIncidentDisabled = false,
  showIncidentActionSection = false,
  isReportingIncident = false,
}: RentalJourneyViewProps) {
  const theme = useTheme();

  return (
    <YStack gap="$3">
      <XStack alignItems="center" gap="$2">
        <IconSymbol color={theme.textSecondary.val} name="map" size={18} />
        <AppText variant="sectionTitle">
          Hành trình
        </AppText>
      </XStack>

      <AppCard
        borderColor="$borderSubtle"
        borderRadius="$5"
        borderWidth={borderWidths.subtle}
        chrome="flat"
        overflow="hidden"
        padding="$0"
        style={elevations.whisper}
      >
        <YStack gap="$5" padding="$5">
          <JourneyPoint
            clockColor={theme.textSecondary.val}
            iconBackground={theme.surfaceSuccess.val}
            iconColor={theme.statusSuccess.val}
            iconName="location.fill"
            label="Trạm bắt đầu"
            lineColor={hasReturnSlot ? theme.statusWarning.val : theme.statusInfo.val}
            timeText={startTimeText}
            value={startStationLabel}
          />

          <JourneyPoint
            clockColor={theme.textSecondary.val}
            iconBackground={hasReturnSlot ? theme.surfaceWarning.val : theme.surfaceAccent.val}
            iconColor={hasReturnSlot ? theme.statusWarning.val : theme.actionPrimary.val}
            iconName="location"
            helperText={isOngoing && !hasReturnSlot ? missingReturnSlotHelperText : undefined}
            isLast
            label={hasReturnSlot ? reservedReturnStationLabel : missingReturnSlotLabel}
            timeText={endTimeText}
            timeTone={hasReturnSlot ? "warning" : isOngoing ? "muted" : "muted"}
            value={endStationLabel}
            valueTone={hasReturnSlot ? "warning" : isOngoing ? "danger" : "default"}
          />
        </YStack>

        {isOngoing
          && ((showBikeSwapSection && onRequestBikeSwap)
            || (showIncidentActionSection && onReportIncident))
          ? (
              <YStack
                backgroundColor="$surfaceDefault"
                borderColor="$borderDefault"
                borderTopWidth={1}
              >
                {showBikeSwapSection && onRequestBikeSwap
                  ? (
                      <BikeSwapRequestCard
                        confirmedBikeLabel={confirmedBikeLabel}
                        disabled={isRequestBikeSwapDisabled}
                        onPress={onRequestBikeSwap}
                        rejectionReason={bikeSwapRejectionReason}
                        status={bikeSwapStatus}
                      />
                    )
                  : null}
                {showIncidentActionSection && onReportIncident
                  ? (
                      <IncidentRequestCard
                        disabled={isReportIncidentDisabled}
                        loading={isReportingIncident}
                        onPress={onReportIncident}
                      />
                    )
                  : null}
              </YStack>
            )
          : null}
      </AppCard>
    </YStack>
  );
}

export function RentalJourneyCard({
  detail,
  ...props
}: RentalJourneyCardProps) {
  const { rental, startStation, endStation, returnSlot, returnStation } = detail;
  const isOngoing = rental.status === "RENTED";
  const hasReturnSlot = isOngoing && Boolean(returnSlot);

  return (
    <RentalJourneyView
      endStationLabel={isOngoing
        ? hasReturnSlot
          ? (returnStation?.name ?? "Bãi trả đã chọn")
          : "Chưa chọn bãi trả"
        : (endStation?.name ?? "Không xác định")}
      endTimeText={isOngoing
        ? hasReturnSlot
          ? `Giữ chỗ từ ${formatTimeOnly(returnSlot?.reservedFrom)}`
          : undefined
        : formatTimeOnly(rental.endTime)}
      hasReturnSlot={hasReturnSlot}
      isOngoing={isOngoing}
      startStationLabel={startStation?.name ?? "Không xác định"}
      startTimeText={formatTimeOnly(rental.startTime)}
      {...props}
    />
  );
}
