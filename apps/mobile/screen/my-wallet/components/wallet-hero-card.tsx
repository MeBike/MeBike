import type { WalletDetail } from "@services/wallets/wallet.service";

import { IconSymbol } from "@components/IconSymbol";
import { borderWidths, iconSizes, radii, spaceScale, spacingRules } from "@theme/metrics";
import { AppText } from "@ui/primitives/app-text";
import { formatBalance, formatWalletStatus } from "@utils/wallet/formatters";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme, View, XStack, YStack } from "tamagui";

type WalletHeroCardProps = {
  wallet: WalletDetail;
  topInset: number;
};

const walletHeroCornerRadius = radii.xxl + spaceScale[2];
const walletHeroIconShellSize = iconSizes.xl + spaceScale[1];
const walletStatusDotSize = spaceScale[2];

function WalletStatusPill({ status }: { status: WalletDetail["status"] }) {
  const theme = useTheme();
  const isActive = status === "ACTIVE";

  return (
    <XStack
      alignItems="center"
      alignSelf="flex-start"
      backgroundColor="$overlayGlass"
      borderColor="$overlayGlass"
      borderRadius={radii.round}
      borderWidth={borderWidths.subtle}
      gap="$2"
      paddingHorizontal="$3"
      paddingVertical="$1"
    >
      <XStack
        backgroundColor={isActive ? theme.statusSuccess.val : theme.statusDanger.val}
        borderRadius="$round"
        height={walletStatusDotSize}
        width={walletStatusDotSize}
      />
      <AppText tone="inverted" variant="badgeLabel">
        {formatWalletStatus(status)}
      </AppText>
    </XStack>
  );
}

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
          <XStack alignItems="center" flexWrap="wrap" gap="$3">
            <AppText opacity={0.82} tone="inverted" variant="eyebrow">
              Số dư tổng
            </AppText>

            <WalletStatusPill status={wallet.status} />
          </XStack>

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
