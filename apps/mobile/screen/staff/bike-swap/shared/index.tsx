import { ActivityIndicator } from "react-native";
import { useTheme, YStack } from "tamagui";

import type { BikeSwapStatus } from "@/types/rental-types";

import { IconSymbol } from "@/components/IconSymbol";
import { AppButton } from "@/ui/primitives/app-button";
import { AppCard } from "@/ui/primitives/app-card";
import { AppText } from "@/ui/primitives/app-text";
import { formatSupportCode } from "@/utils/id";

const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";

export function formatBikeSwapDateTime(value?: string | null) {
  if (!value) {
    return "--";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const parts = new Intl.DateTimeFormat("vi-VN", {
    timeZone: VIETNAM_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const day = Number(parts.find(part => part.type === "day")?.value ?? 0);
  const month = Number(parts.find(part => part.type === "month")?.value ?? 0);
  const year = parts.find(part => part.type === "year")?.value ?? "----";
  const hour = parts.find(part => part.type === "hour")?.value ?? "00";
  const minute = parts.find(part => part.type === "minute")?.value ?? "00";

  return `${hour}:${minute} - ${day}/${month}/${year}`;
}

export function getBikeSwapStatusMeta(status: BikeSwapStatus) {
  switch (status) {
    case "PENDING":
      return { label: "CHỜ XỬ LÝ", pulseDot: true, tone: "warning" as const };
    case "CONFIRMED":
      return { label: "ĐÃ ĐỔI XE", pulseDot: false, tone: "success" as const };
    case "REJECTED":
      return { label: "TỪ CHỐI", pulseDot: false, tone: "danger" as const };
    default:
      return { label: status, pulseDot: false, tone: "neutral" as const };
  }
}

export function getBikeSwapRequestCode(requestId?: string | null) {
  return formatSupportCode(requestId);
}

type BikeSwapLoadingStateProps = {
  message: string;
};

export function BikeSwapLoadingState({ message }: BikeSwapLoadingStateProps) {
  const theme = useTheme();

  return (
    <YStack alignItems="center" flex={1} gap="$4" justifyContent="center" padding="$6">
      <ActivityIndicator color={theme.actionPrimary.val} size="large" />
      <AppText align="center" tone="muted" variant="bodySmall">
        {message}
      </AppText>
    </YStack>
  );
}

type BikeSwapErrorStateProps = {
  description: string;
  onRetry: () => void;
  title: string;
};

export function BikeSwapErrorState({ description, onRetry, title }: BikeSwapErrorStateProps) {
  const theme = useTheme();

  return (
    <YStack flex={1} justifyContent="center" padding="$5">
      <AppCard alignItems="center" borderRadius="$5" chrome="whisper" gap="$4" padding="$6">
        <YStack
          alignItems="center"
          backgroundColor="$surfaceAccent"
          borderRadius="$round"
          height={64}
          justifyContent="center"
          width={64}
        >
          <IconSymbol color={theme.actionPrimary.val} name="warning" size="chip" />
        </YStack>
        <YStack alignItems="center" gap="$2">
          <AppText align="center" variant="headline">
            {title}
          </AppText>
          <AppText align="center" tone="muted" variant="bodySmall">
            {description}
          </AppText>
        </YStack>
        <AppButton onPress={onRetry} width="100%">
          Thử lại
        </AppButton>
      </AppCard>
    </YStack>
  );
}
