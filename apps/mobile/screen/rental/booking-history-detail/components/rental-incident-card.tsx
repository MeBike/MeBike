import { IconSymbol } from "@components/IconSymbol";
import { borderWidths, elevations } from "@theme/metrics";
import { AppButton } from "@ui/primitives/app-button";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { useTheme, XStack, YStack } from "tamagui";

import type { IncidentDetail } from "@/contracts/server";

import {
  formatIncidentDistance,
  formatIncidentDuration,
  getIncidentSourceLabel,
  isIncidentTerminalStatus,
} from "@/screen/incidents/incident-presenters";

type RentalIncidentCardProps = {
  incident: IncidentDetail;
  currentBikeLabel?: string;
  hasReplacementBike: boolean;
  isSubmitting: boolean;
  onReportPress: () => void;
};

function getIncidentStateCopy(incident: IncidentDetail, theme: ReturnType<typeof useTheme>) {
  switch (incident.status) {
    case "OPEN":
      return {
        headerBackground: theme.actionAccent.val,
        headerLabel: "HỖ TRỢ KHẨN CẤP",
        sourceTone: "warning" as const,
        title: "Đã tiếp nhận báo lỗi",
        subtitle: "Hệ thống đang tìm kỹ thuật viên gần nhất để hỗ trợ bạn.",
      };
    case "ASSIGNED":
      return {
        headerBackground: theme.actionAccent.val,
        headerLabel: "HỖ TRỢ KHẨN CẤP",
        sourceTone: "warning" as const,
        title: "Đang điều phối kỹ thuật",
        subtitle: "Kỹ thuật viên đang di chuyển đến vị trí của bạn.",
      };
    case "IN_PROGRESS":
      return {
        headerBackground: theme.actionDanger.val,
        headerLabel: "ĐANG XỬ LÝ SỰ CỐ",
        sourceTone: "danger" as const,
        title: "Kỹ thuật đang hỗ trợ tại chỗ",
        subtitle: "Kỹ thuật viên đang trực tiếp xử lý sự cố cho chuyến thuê của bạn.",
      };
    case "RESOLVED":
    case "CLOSED":
      return {
        headerBackground: theme.statusSuccess.val,
        headerLabel: "HỖ TRỢ ĐÃ HOÀN TẤT",
        sourceTone: "success" as const,
        title: "Sự cố đã được xử lý",
        subtitle: "Hành trình có thể tiếp tục bình thường.",
      };
    case "CANCELLED":
      return {
        headerBackground: theme.textSecondary.val,
        headerLabel: "YÊU CẦU ĐÃ HỦY",
        sourceTone: "muted" as const,
        title: "Yêu cầu hỗ trợ đã hủy",
        subtitle: "Có thể gửi lại báo cáo nếu vấn đề vẫn tiếp diễn.",
      };
    default:
      return {
        headerBackground: theme.textSecondary.val,
        headerLabel: "TRẠNG THÁI CHƯA XÁC ĐỊNH",
        sourceTone: "muted" as const,
        title: "Đang cập nhật trạng thái sự cố",
        subtitle: "Vui lòng thử tải lại để xem thông tin mới nhất.",
      };
  }
}

export function RentalIncidentCard({
  incident,
  currentBikeLabel,
  hasReplacementBike,
  isSubmitting,
  onReportPress,
}: RentalIncidentCardProps) {
  const theme = useTheme();
  const copy = getIncidentStateCopy(incident, theme);
  const isActiveIncident = !isIncidentTerminalStatus(incident.status);
  const canReportAgain = isIncidentTerminalStatus(incident.status);
  const assignmentDuration = formatIncidentDuration(incident.assignments?.durationSeconds ?? null);
  const assignmentDistance = formatIncidentDistance(incident.assignments?.distanceMeters ?? null);
  const technicianName = incident.assignments?.technician?.fullName ?? null;
  const sourceLabel = getIncidentSourceLabel(incident.source).toUpperCase();
  const etaText = assignmentDuration
    ? `Ước tính đến nơi: ${assignmentDuration}`
    : assignmentDistance
      ? `Khoảng cách hiện tại: ${assignmentDistance}`
      : null;
  const replacementMessage = hasReplacementBike && currentBikeLabel
    ? `Xe thay thế đã được cập nhật cho chuyến thuê của bạn: ${currentBikeLabel}.`
    : null;

  return (
    <AppCard
      borderColor="$borderSubtle"
      borderRadius="$6"
      borderWidth={borderWidths.subtle}
      chrome="flat"
      overflow="hidden"
      padding="$0"
      style={elevations.whisper}
    >
      <XStack
        alignItems="center"
        backgroundColor={copy.headerBackground}
        gap="$3"
        paddingHorizontal="$5"
        paddingVertical="$4"
      >
        <XStack
          alignItems="center"
          backgroundColor={theme.overlayGlass.val}
          borderRadius="$4"
          height={34}
          justifyContent="center"
          width={34}
        >
          <IconSymbol color={theme.textInverse.val} name="shield-lock" size="input" />
        </XStack>

        <AppText flex={1} tone="inverted" variant="label">
          {copy.headerLabel}
        </AppText>
      </XStack>

      <YStack gap="$4" padding="$5">
        <YStack gap="$2">
          <AppText tone={copy.sourceTone} variant="eyebrow">
            {sourceLabel}
          </AppText>
          <AppText variant="title">
            {copy.title}
          </AppText>
          <AppText tone="muted" variant="body">
            {copy.subtitle}
          </AppText>
        </YStack>

        {isActiveIncident && (technicianName || etaText)
          ? (
              <XStack alignItems="center" gap="$4" paddingTop="$1">
                <XStack
                  alignItems="center"
                  backgroundColor="$surfaceAccent"
                  borderRadius="$5"
                  height={60}
                  justifyContent="center"
                  width={60}
                >
                  <IconSymbol color={theme.actionPrimary.val} name="person-circle" size="chip" variant="filled" />
                </XStack>

                <YStack flex={1} gap="$1" minWidth={0}>
                  <AppText tone="subtle" variant="eyebrow">
                    KTV phụ trách
                  </AppText>
                  <AppText variant="cardTitle">
                    {technicianName ?? "Đang cập nhật kỹ thuật viên"}
                  </AppText>

                  {etaText
                    ? (
                        <XStack alignItems="center" gap="$2">
                          <IconSymbol color={theme.actionAccent.val} name="clock" size="caption" />
                          <AppText tone="warning" variant="subhead">
                            {etaText}
                          </AppText>
                        </XStack>
                      )
                    : null}
                </YStack>
              </XStack>
            )
          : null}

        {canReportAgain
          ? (
              <AppButton buttonSize="compact" loading={isSubmitting} onPress={onReportPress} tone="soft">
                Báo cáo lại nếu cần hỗ trợ thêm
              </AppButton>
            )
          : null}
      </YStack>

      {replacementMessage
        ? (
            <XStack
              alignItems="flex-start"
              backgroundColor="$surfaceSuccess"
              borderColor="$borderSubtle"
              borderTopWidth={borderWidths.subtle}
              gap="$3"
              padding="$4"
              paddingHorizontal="$5"
            >
              <YStack paddingTop={2}>
                <IconSymbol
                  color={theme.statusSuccess.val}
                  name="check-circle"
                  size="input"
                />
              </YStack>

              <AppText flex={1} tone="success" variant="bodySmall">
                Xe thay thế đã được cập nhật cho chuyến thuê của bạn:
                {" "}
                <AppText tone="success" variant="bodyStrong">{currentBikeLabel}</AppText>
                .
              </AppText>
            </XStack>
          )
        : null}
    </AppCard>
  );
}
