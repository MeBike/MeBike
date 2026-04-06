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
      <AppText align="center" tone={hasReturnSlot ? "muted" : "danger"} variant="body">
        {hasReturnSlot
          ? `Vui lòng đưa mã QR cho nhân viên tại ${returnStationName ?? "bãi trả đã chọn"} để trả xe.`
          : "Bạn cần đặt bãi trả xe trước khi kết thúc hành trình."}
      </AppText>

      {hasReturnSlot
        ? (
            <XStack gap="$3">
              <AppButton flex={1} onPress={onChooseReturnStation} tone="outline">
                Đổi bãi
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
          )
        : (
            <AppButton height={60} onPress={onChooseReturnStation} tone="primary">
              <XStack alignItems="center" gap="$2">
                <IconSymbol color={theme.onActionPrimary.val} name="location" size="md" variant="filled" />
                <AppText tone="inverted" variant="headline">
                  Chọn bãi trả xe
                </AppText>
              </XStack>
            </AppButton>
          )}

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
