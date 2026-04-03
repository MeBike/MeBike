import { LucideIconSymbol as IconSymbol } from "@components/lucide-icon-symbol";
import { borderWidths, elevations } from "@theme/metrics";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { Separator, useTheme, XStack, YStack } from "tamagui";

import type { MyRentalResolvedDetail } from "@/types/rental-types";

import {
  formatCurrencyText,
  getDepositDescription,
  getDepositStatusLabel,
  getDepositStatusTone,
  getPaymentLabel,
} from "../helpers/formatters";

type RentalMetaCardProps = {
  detail: MyRentalResolvedDetail;
};

export function RentalMetaCard({ detail }: RentalMetaCardProps) {
  const theme = useTheme();
  const { rental } = detail;
  const depositStatusTone = getDepositStatusTone(rental.depositStatus);

  return (
    <AppCard
      borderColor="$borderSubtle"
      borderRadius="$5"
      borderWidth={borderWidths.subtle}
      chrome="flat"
      gap="$4"
      padding="$5"
      style={elevations.whisper}
    >
      <XStack alignItems="center" justifyContent="space-between">
        <XStack alignItems="center" gap="$3">
          <YStack
            alignItems="center"
            backgroundColor="$surfaceMuted"
            borderRadius="$round"
            height={44}
            justifyContent="center"
            width={44}
          >
            <IconSymbol color={theme.textSecondary.val} name="wallet.pass.fill" size={20} />
          </YStack>
          <AppText variant="cardTitle">
            Thanh toán
          </AppText>
        </XStack>

        <AppText tone="success" variant="subhead">
          {getPaymentLabel(rental.subscriptionId)}
        </AppText>
      </XStack>

      <Separator borderColor="$borderDefault" />

      <YStack gap="$3">
        <XStack alignItems="center" justifyContent="space-between">
          <XStack alignItems="center" gap="$3">
            <YStack
              alignItems="center"
              backgroundColor="$surfaceMuted"
              borderRadius="$round"
              height={44}
              justifyContent="center"
              width={44}
            >
              <IconSymbol color={theme.textSecondary.val} name="lock.shield.fill" size={20} />
            </YStack>
            <YStack gap="$1">
              <AppText variant="cardTitle">
                Tiền cọc
              </AppText>
              <AppText tone="muted" variant="bodySmall">
                {formatCurrencyText(rental.depositAmount ?? 0).replace(" (Gói tháng)", "")}
              </AppText>
            </YStack>
          </XStack>

          <AppText tone={depositStatusTone} variant="subhead">
            {getDepositStatusLabel(rental.depositStatus)}
          </AppText>
        </XStack>

        <AppText tone="muted" variant="bodySmall">
          {getDepositDescription(rental.depositStatus)}
        </AppText>
      </YStack>
    </AppCard>
  );
}
