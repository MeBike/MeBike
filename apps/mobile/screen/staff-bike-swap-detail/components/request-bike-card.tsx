import { useTheme, XStack, YStack } from "tamagui";

import type { BikeSwapRequestDetail } from "@/types/rental-types";

import { IconSymbol } from "@/components/IconSymbol";
import { AppCard } from "@/ui/primitives/app-card";
import { AppText } from "@/ui/primitives/app-text";

type RequestBikeCardProps = {
  request: BikeSwapRequestDetail;
};

function BikeInfoPanel({
  chipId,
  iconColor,
  iconName,
  supplierName,
  subtitle,
  tone,
}: {
  chipId: string;
  iconColor: string;
  iconName: "bicycle" | "checkmark.circle.fill";
  supplierName: string;
  subtitle: string;
  tone: "warning" | "success";
}) {
  return (
    <YStack gap="$2">
      <AppText tone={tone === "success" ? "success" : "warning"} variant="label">
        {subtitle}
      </AppText>

      <AppCard
        borderColor="$borderSubtle"
        borderRadius={22}
        borderWidth={1}
        chrome="flat"
        padding="$4"
        tone={tone}
      >
        <XStack alignItems="center" gap="$3">
          <IconSymbol color={iconColor} name={iconName} size={24} />

          <YStack flex={1} gap="$1">
            <AppText variant="sectionTitle">
              {chipId}
            </AppText>
            <AppText tone={tone === "success" ? "success" : "warning"} variant="bodySmall">
              {supplierName}
            </AppText>
          </YStack>
        </XStack>
      </AppCard>
    </YStack>
  );
}

export function RequestBikeCard({ request }: RequestBikeCardProps) {
  const theme = useTheme();

  return (
    <AppCard borderRadius={32} chrome="whisper" gap="$4" padding="$4">
      <BikeInfoPanel
        chipId={request.oldBike.chipId}
        iconColor={theme.statusWarning.val}
        iconName="bicycle"
        subtitle="Xe báo lỗi (Cần thu hồi)"
        supplierName={request.oldBike.supplier.name}
        tone="warning"
      />

      {request.status === "CONFIRMED" && request.newBike
        ? (
            <BikeInfoPanel
              chipId={request.newBike.chipId}
              iconColor={theme.statusSuccess.val}
              iconName="checkmark.circle.fill"
              subtitle="Xe cấp mới (Giao khách)"
              supplierName={request.newBike.supplier.name}
              tone="success"
            />
          )
        : null}

      {request.status === "PENDING"
        ? (
            <AppCard borderRadius={22} chrome="flat" padding="$4" tone="muted">
              <XStack alignItems="flex-start" gap="$3">
                <IconSymbol color={theme.actionPrimary.val} name="info.circle" size={18} />
                <AppText flex={1} tone="muted" variant="bodySmall">
                  Hệ thống sẽ tự động chọn 1 xe
                  {" "}
                  <AppText tone="default" variant="bodyStrong">
                    AVAILABLE
                  </AppText>
                  {" "}
                  tại trạm để giao cho khách khi bạn bấm
                  {" "}
                  <AppText tone="default" variant="bodyStrong">
                    Chấp nhận
                  </AppText>
                  .
                </AppText>
              </XStack>
            </AppCard>
          )
        : null}
    </AppCard>
  );
}
