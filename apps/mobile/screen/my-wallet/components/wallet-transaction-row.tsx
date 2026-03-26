import { useTheme, XStack, YStack } from "tamagui";

import type { WalletTransactionDetail } from "@services/wallets/wallet.service";

import { IconSymbol } from "@components/IconSymbol";
import { AppListRow } from "@ui/primitives/app-list-row";
import { AppText } from "@ui/primitives/app-text";
import {
  formatCurrency,
  formatDate,
  formatTransactionStatus,
  formatTransactionType,
} from "@utils/wallet/formatters";

type WalletTransactionRowProps = {
  item: WalletTransactionDetail;
  onPress?: () => void;
  showDivider: boolean;
};

type TransactionVisual = {
  iconName: "arrow.down" | "arrow.up" | "arrow.clockwise" | "slider.horizontal.3";
  iconColor: string;
  iconBackground: string;
  amountTone: "success" | "brand" | "warning" | "default";
  amountPrefix: "+" | "-";
  fallbackLabel: string;
};

function getTransactionVisual(item: WalletTransactionDetail, theme: ReturnType<typeof useTheme>): TransactionVisual {
  switch (item.type) {
    case "DEPOSIT":
      return {
        iconName: "arrow.down",
        iconColor: theme.statusSuccess.val,
        iconBackground: theme.surfaceSuccess.val,
        amountTone: "success",
        amountPrefix: "+",
        fallbackLabel: "Nạp tiền",
      };
    case "REFUND":
      return {
        iconName: "arrow.clockwise",
        iconColor: theme.actionPrimary.val,
        iconBackground: theme.surfaceAccent.val,
        amountTone: "brand",
        amountPrefix: "+",
        fallbackLabel: "Hoàn tiền",
      };
    case "ADJUSTMENT":
      return {
        iconName: "slider.horizontal.3",
        iconColor: theme.statusWarning.val,
        iconBackground: theme.surfaceWarning.val,
        amountTone: "warning",
        amountPrefix: "+",
        fallbackLabel: "Điều chỉnh",
      };
    case "DEBIT":
    default:
      return {
        iconName: "arrow.up",
        iconColor: theme.textPrimary.val,
        iconBackground: theme.surfaceMuted.val,
        amountTone: "default",
        amountPrefix: "-",
        fallbackLabel: "Thanh toán",
      };
  }
}

export function WalletTransactionRow({ item, onPress, showDivider }: WalletTransactionRowProps) {
  const theme = useTheme();
  const visual = getTransactionVisual(item, theme);
  const status = item.status.toUpperCase();
  const title = item.description?.trim() || visual.fallbackLabel;
  const hint = formatTransactionType(item.type);

  return (
    <AppListRow
      dividerInset="$4"
      leading={(
        <XStack
          alignItems="center"
          backgroundColor={visual.iconBackground}
          borderRadius="$round"
          height={52}
          justifyContent="center"
          width={52}
        >
          <IconSymbol color={visual.iconColor} name={visual.iconName} size={22} />
        </XStack>
      )}
      onPress={onPress}
      primary={(
        <AppText numberOfLines={1} variant="cardTitle">
          {title}
        </AppText>
      )}
      secondary={(
        <AppText tone="muted" variant="bodySmall">
          {formatDate(item.createdAt)}
        </AppText>
      )}
      showDivider={showDivider}
      trailing={(
        <YStack alignItems="flex-end" gap="$2">
          <AppText tone={visual.amountTone} variant="headline">
            {visual.amountPrefix}
            {" "}
            {formatCurrency(item.amount)}
          </AppText>

          {status === "SUCCESS"
            ? (
                <AppText tone="muted" variant="bodySmall">
                  {hint}
                </AppText>
              )
            : (
                <XStack alignItems="center" gap="$1">
                  <IconSymbol
                    color={status === "FAILED" ? theme.statusDanger.val : theme.statusWarning.val}
                    name={status === "FAILED" ? "exclamationmark.triangle" : "clock"}
                    size={12}
                  />
                  <AppText tone={status === "FAILED" ? "danger" : "warning"} variant="meta">
                    {formatTransactionStatus(item.status)}
                  </AppText>
                </XStack>
              )}
        </YStack>
      )}
    />
  );
}
