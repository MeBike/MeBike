import { IconSymbol } from "@components/IconSymbol";
import { colors } from "@theme/colors";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { View } from "react-native";
import { XStack, YStack } from "tamagui";

import type { MyRentalResolvedDetail } from "@/types/rental-types";

import { softCardShadowStyle } from "../card-shadow";
import { getPaymentLabel } from "../helpers/formatters";

type RentalMetaCardProps = {
  detail: MyRentalResolvedDetail;
};

export function RentalMetaCard({ detail }: RentalMetaCardProps) {
  const { rental } = detail;

  return (
    <View style={softCardShadowStyle}>
      <AppCard borderRadius="$5" elevated={false} padding="$5">
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

          <AppText tone="success" variant="headline">
            {getPaymentLabel(rental.subscriptionId)}
          </AppText>
        </XStack>
      </AppCard>
    </View>
  );
}
