import type { WalletTransactionDetail } from "@services/wallets/wallet.service";

import { IconSymbol } from "@components/IconSymbol";
import { colors } from "@theme/colors";
import { AppListRow } from "@ui/primitives/app-list-row";
import { AppText } from "@ui/primitives/app-text";
import {
  formatCurrency,
  formatDate,
  formatTransactionStatus,
  formatTransactionType,
} from "@utils/wallet/formatters";
import { XStack, YStack } from "tamagui";

type WalletTransactionRowProps = {
  item: WalletTransactionDetail;
  onPress?: () => void;
  showDivider: boolean;
};

type TransactionVisual = {
  iconName: "arrow.down" | "arrow.up" | "arrow.clockwise" | "slider.horizontal.3";
  iconColor: string;
  iconBackground: string;
  amountColor: string;
  amountPrefix: "+" | "-";
  fallbackLabel: string;
};

function getTransactionVisual(item: WalletTransactionDetail): TransactionVisual {
  switch (item.type) {
    case "DEPOSIT":
      return {
        iconName: "arrow.down",
        iconColor: colors.success,
        iconBackground: colors.successSoft,
        amountColor: colors.success,
        amountPrefix: "+",
        fallbackLabel: "Nạp tiền",
      };
    case "REFUND":
      return {
        iconName: "arrow.clockwise",
        iconColor: colors.brandPrimary,
        iconBackground: colors.surfaceAccent,
        amountColor: colors.brandPrimary,
        amountPrefix: "+",
        fallbackLabel: "Hoàn tiền",
      };
    case "ADJUSTMENT":
      return {
        iconName: "slider.horizontal.3",
        iconColor: colors.warning,
        iconBackground: colors.warningSoft,
        amountColor: colors.warning,
        amountPrefix: "+",
        fallbackLabel: "Điều chỉnh",
      };
    case "DEBIT":
    default:
      return {
        iconName: "arrow.up",
        iconColor: colors.textPrimary,
        iconBackground: colors.surfaceMuted,
        amountColor: colors.textPrimary,
        amountPrefix: "-",
        fallbackLabel: "Thanh toán",
      };
  }
}

export function WalletTransactionRow({ item, onPress, showDivider }: WalletTransactionRowProps) {
  const visual = getTransactionVisual(item);
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
          <AppText color={visual.amountColor} variant="headline">
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
                    color={status === "FAILED" ? colors.error : colors.warning}
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
