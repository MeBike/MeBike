import type { WalletError } from "@services/wallets/wallet-error";

import {
  hasStripeConnectOnboardingUrls,
  STRIPE_CONNECT_REFRESH_URL,
  STRIPE_CONNECT_RETURN_URL,
} from "@lib/stripe";
import { walletServiceV1 } from "@services/wallets/wallet.service";
import { AppText } from "@ui/primitives/app-text";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Linking } from "react-native";
import { useTheme } from "tamagui";

import { presentWalletError } from "@/presenters/wallets/wallet-error-presenter";
import { formatBalance } from "@/utils/wallet/formatters";

import { WalletAmountSheet } from "../wallet-amount-sheet";

type WalletWithdrawSheetProps = {
  availableBalance: string;
  onClose: () => void;
  onSuccess?: () => Promise<void> | void;
  visible: boolean;
};

const QUICK_AMOUNTS = ["50000", "100000", "200000", "500000"] as const;
const DEFAULT_WITHDRAW_AMOUNT = 50000;

function clampWithdrawalAmount(value: string, availableBalanceNumber: number): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) {
    return "";
  }

  const available = Math.max(0, Math.floor(availableBalanceNumber));
  if (available === 0) {
    return "";
  }

  return String(Math.min(Number(digits), available));
}

function getInitialWithdrawalAmount(availableBalanceNumber: number): string {
  const available = Math.max(0, Math.floor(availableBalanceNumber));
  if (available === 0) {
    return "";
  }

  return String(Math.min(DEFAULT_WITHDRAW_AMOUNT, available));
}

function isWithdrawalNotEnabled(error: WalletError): boolean {
  return error._tag === "ApiError" && error.code === "WITHDRAWAL_NOT_ENABLED";
}

export function WalletWithdrawSheet({
  availableBalance,
  onClose,
  onSuccess,
  visible,
}: WalletWithdrawSheetProps) {
  const theme = useTheme();
  const availableBalanceNumber = useMemo(() => Number(availableBalance), [availableBalance]);
  const quickAmounts = useMemo(
    () => QUICK_AMOUNTS.filter(value => Number(value) <= availableBalanceNumber),
    [availableBalanceNumber],
  );
  const [amount, setAmount] = useState(() => getInitialWithdrawalAmount(availableBalanceNumber));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setAmount((currentAmount) => {
      const clampedAmount = clampWithdrawalAmount(currentAmount, availableBalanceNumber);
      return clampedAmount || getInitialWithdrawalAmount(availableBalanceNumber);
    });
    setErrorMessage(null);
  }, [availableBalanceNumber, visible]);

  const handleAmountChange = useCallback((value: string) => {
    setAmount(clampWithdrawalAmount(value, availableBalanceNumber));
    setErrorMessage(null);
  }, [availableBalanceNumber]);

  const handleStartOnboarding = useCallback(async () => {
    if (!hasStripeConnectOnboardingUrls()) {
      Alert.alert(
        "Thiết lập nhận tiền chưa sẵn sàng",
        "Thiếu cấu hình EXPO_PUBLIC_STRIPE_CONNECT_RETURN_URL hoặc EXPO_PUBLIC_STRIPE_CONNECT_REFRESH_URL.",
      );
      return;
    }

    setIsSubmitting(true);
    const result = await walletServiceV1.startStripeConnectOnboarding({
      returnUrl: STRIPE_CONNECT_RETURN_URL,
      refreshUrl: STRIPE_CONNECT_REFRESH_URL,
    });
    setIsSubmitting(false);

    if (!result.ok) {
      Alert.alert("Chưa thể thiết lập nhận tiền", presentWalletError(result.error));
      return;
    }

    try {
      await Linking.openURL(result.value.onboardingUrl);
    }
    catch {
      Alert.alert("Chưa thể mở trang thiết lập", "Vui lòng thử lại sau ít phút.");
    }
  }, []);

  const handleSubmitWithdrawal = useCallback(async () => {
    const trimmed = amount.trim();
    if (!/^\d+$/.test(trimmed)) {
      setErrorMessage("Vui lòng nhập số tiền bằng VND.");
      return;
    }

    const amountNumber = Number(trimmed);
    if (amountNumber <= 0) {
      setErrorMessage("Số tiền rút phải lớn hơn 0.");
      return;
    }

    if (amountNumber > availableBalanceNumber) {
      setErrorMessage("Số dư khả dụng không đủ để tạo yêu cầu rút tiền.");
      return;
    }

    setIsSubmitting(true);
    const result = await walletServiceV1.createWalletWithdrawal({
      amount: trimmed,
      currency: "vnd",
    });
    setIsSubmitting(false);

    if (!result.ok) {
      if (isWithdrawalNotEnabled(result.error)) {
        Alert.alert(
          "Thiết lập nhận tiền",
          "Bạn cần hoàn tất thông tin nhận tiền trước khi rút ví. Tiếp tục đến trang thiết lập Stripe Connect?",
          [
            { text: "Để sau", style: "cancel" },
            { text: "Thiết lập ngay", onPress: () => void handleStartOnboarding() },
          ],
        );
        return;
      }

      Alert.alert("Không thể gửi yêu cầu rút tiền", presentWalletError(result.error));
      return;
    }

    onClose();
    try {
      await onSuccess?.();
    }
    catch {
      // Wallet refresh failure should not block user acknowledgement.
    }

    Alert.alert(
      "Đã ghi nhận yêu cầu rút tiền",
      "Yêu cầu của bạn đang được xử lý. Số dư khả dụng sẽ chuyển sang tạm giữ cho đến khi thanh toán hoàn tất.",
    );
  }, [amount, availableBalanceNumber, handleStartOnboarding, onClose, onSuccess]);

  return (
    <WalletAmountSheet
      amount={amount}
      description={(
        <AppText tone="muted" variant="bodySmall">
          Nhập số tiền bằng VND. Yêu cầu rút tiền sẽ được ghi nhận trước, sau đó hệ thống sẽ xử lý thanh toán.
        </AppText>
      )}
      errorMessage={errorMessage}
      helperText={(
        <AppText tone="muted" variant="bodySmall">
          Số dư khả dụng hiện tại:
          {" "}
          <AppText tone="default" variant="bodyStrong">
            {formatBalance(availableBalance)}
            {" "}
            đ
          </AppText>
        </AppText>
      )}
      isSubmitting={isSubmitting}
      onAmountChange={handleAmountChange}
      onClose={onClose}
      onSubmit={() => void handleSubmitWithdrawal()}
      primaryButtonColor={theme.textPrimary.val}
      primaryButtonTextColor={theme.surfaceDefault.val}
      quickAmounts={quickAmounts}
      submitLabel="Gửi yêu cầu rút tiền"
      title="Rút tiền"
      visible={visible}
    />
  );
}
