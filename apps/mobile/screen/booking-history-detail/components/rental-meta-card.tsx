import { IconSymbol } from "@components/IconSymbol";
import { colors } from "@theme/colors";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { View } from "react-native";
import { Separator, XStack, YStack } from "tamagui";

import type { MyRentalResolvedDetail } from "@/types/rental-types";

import { softCardShadowStyle } from "../card-shadow";
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
  const { rental } = detail;
  const depositStatusTone = getDepositStatusTone(rental.depositStatus);

  return (
    <View style={softCardShadowStyle}>
      <AppCard borderRadius="$5" elevated={false} gap="$4" padding="$5">
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
              <IconSymbol color={colors.textSecondary} name="wallet.pass.fill" size={20} />
            </YStack>
            <AppText variant="cardTitle">
              Thanh toán
            </AppText>
          </XStack>

          <AppText tone="success" variant="subhead">
            {getPaymentLabel(rental.subscriptionId)}
          </AppText>
        </XStack>

        <Separator borderColor="$divider" />

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
                <IconSymbol color={colors.textSecondary} name="lock.shield.fill" size={20} />
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
    </View>
  );
}
