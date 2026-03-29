import { Pressable } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";

import type { WalletTransactionDetail } from "@services/wallets/wallet.service";

import { IconSymbol } from "@components/IconSymbol";
import { iconSizes, spaceScale } from "@theme/metrics";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import {
  formatBalance,
  formatDate,
  formatTransactionTitle,
  formatTransactionType,
} from "@utils/wallet/formatters";

type WalletTransactionRowProps = {
  item: WalletTransactionDetail;
  onPress?: () => void;
};

type TransactionVisual = {
  iconName: "arrow.down" | "arrow.up" | "arrow.clockwise" | "slider.horizontal.3";
  iconColor: string;
  iconBackground: string;
  amountTone: "success" | "brand" | "warning" | "default";
  amountPrefix: "+" | "-";
};

const transactionIconShellSize = "$6";

function getTransactionVisual(item: WalletTransactionDetail, theme: ReturnType<typeof useTheme>): TransactionVisual {
  switch (item.type) {
    case "DEPOSIT":
      return {
        iconName: "arrow.down",
        iconColor: theme.statusSuccess.val,
        iconBackground: theme.surfaceSuccess.val,
        amountTone: "success",
        amountPrefix: "+",
      };
    case "REFUND":
      return {
        iconName: "arrow.clockwise",
        iconColor: theme.statusSuccess.val,
        iconBackground: theme.surfaceSuccess.val,
        amountTone: "success",
        amountPrefix: "+",
      };
    case "ADJUSTMENT":
      return {
        iconName: "slider.horizontal.3",
        iconColor: theme.statusWarning.val,
        iconBackground: theme.surfaceWarning.val,
        amountTone: "warning",
        amountPrefix: "+",
      };
    case "DEBIT":
    default:
      return {
        iconName: "arrow.up",
        iconColor: theme.textPrimary.val,
        iconBackground: theme.surfaceMuted.val,
        amountTone: "default",
        amountPrefix: "-",
      };
  }
}

export function WalletTransactionRow({ item, onPress }: WalletTransactionRowProps) {
  const theme = useTheme();
  const visual = getTransactionVisual(item, theme);
  const title = formatTransactionTitle(item.type, item.description);
  const typeLabel = formatTransactionType(item.type);
  const amount = Math.abs(Number(item.amount));
  const amountText = `${visual.amountPrefix} ${formatBalance(amount)} đ`;
  const typeTone = visual.amountTone === "success"
    ? "success"
    : visual.amountTone === "warning"
      ? "warning"
      : "muted";

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.96 : 1 })}>
      <AppCard
        backgroundColor="$surfaceDefault"
        borderRadius="$4"
        borderColor="transparent"
        borderWidth={0}
        chrome="flat"
        elevation={0}
        padding="$0"
        shadowColor="transparent"
        shadowOffset={{ width: 0, height: 0 }}
        shadowOpacity={0}
        shadowRadius={0}
      >
        <XStack
          alignItems="center"
          gap="$3"
          justifyContent="space-between"
          paddingHorizontal="$4"
          paddingVertical="$3"
        >
          <XStack alignItems="center" flex={1} gap="$3">
          <XStack
            alignItems="center"
            backgroundColor={visual.iconBackground}
            borderRadius="$round"
            height={transactionIconShellSize}
            justifyContent="center"
            width={transactionIconShellSize}
          >
            <IconSymbol color={visual.iconColor} name={visual.iconName} size={iconSizes.md} />
          </XStack>

          <YStack flex={1} gap="$1" minWidth={0}>
            <AppText numberOfLines={1} variant="compactStrong">
              {title}
            </AppText>

            <AppText tone="muted" variant="bodySmall">
              {formatDate(item.createdAt)}
            </AppText>
          </YStack>
        </XStack>

          <YStack alignItems="flex-end" flexShrink={0} gap="$1" minWidth={spaceScale[10] + spaceScale[3]}>
            <AppText
              align="right"
              style={{ fontVariant: ["tabular-nums"] }}
              tone={visual.amountTone}
              variant="compactStrong"
            >
              {amountText}
            </AppText>

            <AppText
              align="right"
              numberOfLines={1}
              tone={typeTone}
              variant="caption"
            >
              {typeLabel}
            </AppText>
          </YStack>
        </XStack>
      </AppCard>
    </Pressable>
  );
}
