import type { WalletDetail } from "@services/wallets/wallet.service";

import { IconSymbol } from "@components/IconSymbol";
import { borderWidths, iconSizes, radii, spaceScale, spacingRules } from "@theme/metrics";
import { AppText } from "@ui/primitives/app-text";
import { formatBalance } from "@utils/wallet/formatters";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme, View, XStack, YStack } from "tamagui";

type WalletHeroCardProps = {
  wallet: WalletDetail;
  topInset: number;
};

const walletHeroCornerRadius = radii.xxl + spaceScale[2];
const walletHeroIconShellSize = iconSizes.xl + spaceScale[1];

function WalletBalanceSplit({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <YStack
      flex={1}
      gap="$1"
    >
      <AppText opacity={0.72} tone="inverted" variant="meta">
        {label}
      </AppText>
      <AppText tone="inverted" variant="sectionTitle">
        {formatBalance(value)}
        {" "}
        đ
      </AppText>
    </YStack>
  );
}

export function WalletHeroCard({ wallet, topInset }: WalletHeroCardProps) {
  const theme = useTheme();

  return (
    <LinearGradient
      colors={[theme.actionPrimary.val, theme.actionSecondary.val]}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={{
        borderBottomLeftRadius: walletHeroCornerRadius,
        borderBottomRightRadius: walletHeroCornerRadius,
        paddingTop: topInset + spacingRules.hero.paddingTop,
        paddingBottom: spacingRules.hero.paddingBottomCompact + spacingRules.page.sectionGap,
      }}
    >
      <YStack
        gap="$5"
        paddingHorizontal="$5"
      >
        <XStack alignItems="center" justifyContent="space-between">
          <AppText tone="inverted" variant="xlTitle">
            Ví của tôi
          </AppText>

          <XStack
            alignItems="center"
            backgroundColor="$overlayGlassMuted"
            borderColor="$overlayGlassMuted"
            borderRadius="$round"
            borderWidth={borderWidths.subtle}
            height={walletHeroIconShellSize}
            justifyContent="center"
            width={walletHeroIconShellSize}
          >
            <IconSymbol color={theme.onSurfaceBrand.val} name="wallet" size="lg" />
          </XStack>
        </XStack>

        <YStack gap="$3">
          <AppText opacity={0.82} tone="inverted" variant="eyebrow">
            Số dư tổng
          </AppText>

          <XStack alignItems="flex-end" gap="$1">
            <AppText tone="inverted" variant="metricValue">
              {formatBalance(wallet.balance)}
            </AppText>
            <AppText marginBottom="$1" tone="inverted" variant="sectionTitle">
              đ
            </AppText>
          </XStack>
        </YStack>

        <XStack
          alignItems="stretch"
          backgroundColor="$overlayGlassMuted"
          borderColor="$overlayGlass"
          borderRadius={radii.xxl}
          borderWidth={borderWidths.subtle}
          gap="$3"
          padding="$4"
        >
          <WalletBalanceSplit label="Khả dụng" value={wallet.availableBalance} />

          <View backgroundColor="$overlayGlass" borderRadius="$round" width={1} />

          <WalletBalanceSplit label="Đang tạm giữ" value={wallet.reservedBalance} />
        </XStack>
      </YStack>
    </LinearGradient>
  );
}
