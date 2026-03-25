import type { WalletDetail } from "@services/wallets/wallet.service";

import { IconSymbol } from "@components/IconSymbol";
import { gradients } from "@theme/colors";
import { borderWidths, radii, spacing } from "@theme/metrics";
import { AppText } from "@ui/primitives/app-text";
import { formatBalance, formatWalletStatus } from "@utils/wallet/formatters";
import { LinearGradient } from "expo-linear-gradient";
import { XStack, YStack } from "tamagui";

type WalletHeroCardProps = {
  wallet: WalletDetail;
  topInset: number;
};

function WalletStatusPill({ status }: { status: WalletDetail["status"] }) {
  const isActive = status === "ACTIVE";

  return (
    <XStack
      alignItems="center"
      alignSelf="flex-start"
      backgroundColor="rgba(255,255,255,0.14)"
      borderColor="rgba(255,255,255,0.18)"
      borderRadius={radii.round}
      borderWidth={borderWidths.subtle}
      gap="$2"
      paddingHorizontal="$4"
      paddingVertical="$2"
    >
      <XStack
        backgroundColor={isActive ? "#6EE7B7" : "$error"}
        borderRadius="$round"
        height={8}
        width={8}
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
      backgroundColor="rgba(255,255,255,0.12)"
      borderColor="rgba(255,255,255,0.14)"
      borderRadius={radii.xl}
      borderWidth={borderWidths.subtle}
      flex={1}
      gap="$2"
      padding="$4"
    >
      <AppText color="rgba(255,255,255,0.76)" variant="bodySmall">
        {label}
      </AppText>
      <AppText tone="inverted" variant="headline">
        {formatBalance(value)}
        {" "}
        đ
      </AppText>
    </YStack>
  );
}

export function WalletHeroCard({ wallet, topInset }: WalletHeroCardProps) {
  return (
    <LinearGradient
      colors={[...gradients.brandHero]}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={{
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
        paddingTop: topInset + spacing.xxxl,
        paddingBottom: spacing.xxxxl + spacing.md,
      }}
    >
      <YStack
        gap="$5"
        paddingHorizontal="$6"
      >
        <XStack alignItems="center" justifyContent="space-between">
          <AppText tone="inverted" variant="title">
            Ví của tôi
          </AppText>

          <XStack
            alignItems="center"
            backgroundColor="rgba(255,255,255,0.12)"
            borderRadius="$round"
            height={56}
            justifyContent="center"
            width={56}
          >
            <IconSymbol color="rgba(255,255,255,0.92)" name="wallet.pass.fill" size={24} />
          </XStack>
        </XStack>

        <YStack gap="$3">
          <AppText color="rgba(255,255,255,0.82)" variant="eyebrow">
            Số dư tổng
          </AppText>

          <XStack alignItems="flex-end" gap="$2">
            <AppText tone="inverted" variant="metricValue">
              {formatBalance(wallet.balance)}
            </AppText>
            <AppText marginBottom={6} tone="inverted" variant="headline">
              đ
            </AppText>
          </XStack>

          <WalletStatusPill status={wallet.status} />
        </YStack>

        <XStack gap="$3">
          <WalletBalanceSplit label="Khả dụng" value={wallet.availableBalance} />
          <WalletBalanceSplit label="Đang tạm giữ" value={wallet.reservedBalance} />
        </XStack>
      </YStack>
    </LinearGradient>
  );
}
