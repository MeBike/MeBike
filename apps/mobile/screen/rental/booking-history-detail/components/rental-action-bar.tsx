import { IconSymbol } from "@components/IconSymbol";
import { spaceScale } from "@theme/metrics";
import { AppButton } from "@ui/primitives/app-button";
import { AppText } from "@ui/primitives/app-text";
import { useTheme, XStack, YStack } from "tamagui";

type RentalActionBarProps = {
  rentalId: string;
  currentReturnStationId?: string;
  returnStationName?: string | null;
  bottomInset: number;
  onChooseReturnStation: () => void;
  onOpenReturnQr: () => void;
};

export function RentalActionBar({
  rentalId,
  currentReturnStationId,
  returnStationName,
  bottomInset,
  onChooseReturnStation,
  onOpenReturnQr,
}: RentalActionBarProps) {
  const theme = useTheme();
  const hasReturnSlot = Boolean(currentReturnStationId);

  return (
    <YStack
      backgroundColor="$surfaceDefault"
      borderColor="$borderSubtle"
      borderTopWidth={1}
      gap="$4"
      paddingHorizontal="$5"
      paddingTop="$5"
      paddingBottom={Math.max(bottomInset, spaceScale[4])}
    >
      <AppText align="center" tone={hasReturnSlot ? "muted" : "muted"} variant="body">
        {hasReturnSlot
          ? `Vui lòng đưa mã QR cho nhân viên tại ${returnStationName ?? "bãi trả đã chọn"} để trả xe.`
          : "Đưa mã QR cho nhân viên tại trạm còn chỗ. Giữ chỗ trước nếu muốn chắc suất."}
      </AppText>

      <XStack gap="$3">
        <AppButton flex={1} onPress={onChooseReturnStation} tone="primary">
          <XStack alignItems="center" gap="$2">
            <AppText tone="inverted" variant="actionLabel">
              {hasReturnSlot ? "Đổi bãi" : "Giữ chỗ"}
            </AppText>
          </XStack>
        </AppButton>
        <AppButton flex={2} onPress={onOpenReturnQr} tone="primary">
          <XStack alignItems="center" gap="$2">
            <IconSymbol color={theme.onActionPrimary.val} name="qr-code" size="md" />
            <AppText tone="inverted" variant="actionLabel">
              Mã QR trả xe
            </AppText>
          </XStack>
        </AppButton>
      </XStack>

      <AppText align="center" tone="subtle" variant="meta">
        Mã thuê:
        {" "}
        {
          rentalId.slice(0, 8).toUpperCase()
        }
      </AppText>
    </YStack>
  );
}
