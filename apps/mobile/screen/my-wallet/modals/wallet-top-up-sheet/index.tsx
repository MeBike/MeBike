import { log } from "@lib/log";
import { hasStripePublishableKey, STRIPE_RETURN_URL } from "@lib/stripe";
import { walletTopupService } from "@services/wallet-topup.service";
import {
  initPaymentSheet,
  PaymentSheetError,
  presentPaymentSheet,
} from "@stripe/stripe-react-native";
import { AppText } from "@ui/primitives/app-text";
import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useTheme } from "tamagui";

import { presentWalletError } from "@/presenters/wallets/wallet-error-presenter";

import { WalletAmountSheet } from "../wallet-amount-sheet";

type WalletTopUpSheetProps = {
  onClose: () => void;
  onSuccess?: () => Promise<void> | void;
  visible: boolean;
};

const QUICK_AMOUNTS = ["50000", "100000", "200000", "500000"] as const;
const STRIPE_TOPUP_MIN_AMOUNT = 15000;
const STRIPE_TOPUP_MAX_AMOUNT = 5000000;

function getTopupUnavailableMessage() {
  return "Tính năng nạp tiền hiện chưa sẵn sàng. Vui lòng thử lại sau.";
}

function getPaymentInitializationMessage() {
  return "Không thể thực hiện thanh toán lúc này. Vui lòng thử lại sau.";
}

function getPaymentFailureMessage() {
  return "Thanh toán chưa hoàn tất. Vui lòng thử lại hoặc chọn phương thức khác.";
}

export function WalletTopUpSheet({ visible, onClose, onSuccess }: WalletTopUpSheetProps) {
  const theme = useTheme();
  const [amount, setAmount] = useState("50000");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAmountChange = useCallback((value: string) => {
    setAmount(value);
    setErrorMessage(null);
  }, []);

  const handleStartTopup = useCallback(async () => {
    if (!hasStripePublishableKey()) {
      Alert.alert("Chưa thể nạp tiền", getTopupUnavailableMessage());
      return;
    }

    const trimmed = amount.trim();
    if (!/^\d+$/.test(trimmed)) {
      setErrorMessage("Vui lòng nhập số tiền bằng VND.");
      return;
    }

    if (Number(trimmed) < STRIPE_TOPUP_MIN_AMOUNT) {
      setErrorMessage("Số tiền tối thiểu là 15.000 VND.");
      return;
    }

    if (Number(trimmed) > STRIPE_TOPUP_MAX_AMOUNT) {
      setErrorMessage("Số tiền tối đa là 5.000.000 VND.");
      return;
    }

    setIsSubmitting(true);
    const result = await walletTopupService.createStripePaymentSheet({
      amount: trimmed,
      currency: "vnd",
    });

    if (!result.ok) {
      setIsSubmitting(false);
      Alert.alert("Không thể tạo phiên thanh toán", presentWalletError(result.error));
      return;
    }

    log.info("Created Stripe PaymentSheet top-up attempt", {
      amount: trimmed,
      paymentAttemptId: result.value.paymentAttemptId,
    });

    const initialized = await initPaymentSheet({
      merchantDisplayName: "MeBike",
      paymentIntentClientSecret: result.value.paymentIntentClientSecret,
      returnURL: STRIPE_RETURN_URL,
    });

    if (initialized.error) {
      setIsSubmitting(false);
      log.error("Stripe PaymentSheet initialization failed", {
        amount: trimmed,
        code: initialized.error.code,
        message: initialized.error.message,
        paymentAttemptId: result.value.paymentAttemptId,
      });
      Alert.alert("Chưa thể thanh toán", getPaymentInitializationMessage());
      return;
    }

    const presented = await presentPaymentSheet();
    setIsSubmitting(false);

    if (presented.error) {
      if (presented.error.code === PaymentSheetError.Canceled) {
        log.info("Stripe PaymentSheet canceled", {
          amount: trimmed,
          paymentAttemptId: result.value.paymentAttemptId,
        });
        return;
      }

      log.error("Stripe PaymentSheet presentation failed", {
        amount: trimmed,
        code: presented.error.code,
        message: presented.error.message,
        paymentAttemptId: result.value.paymentAttemptId,
      });
      Alert.alert("Thanh toán thất bại", getPaymentFailureMessage());
      return;
    }

    onClose();
    try {
      await onSuccess?.();
    }
    catch {
      // Ignore wallet refresh failures; webhook remains source of truth.
    }
  }, [amount, onClose, onSuccess]);

  return (
    <WalletAmountSheet
      amount={amount}
      description={(
        <AppText tone="muted" variant="bodySmall">
          Nhập số tiền bằng VND. Số tiền tối thiểu là
          {" "}
          <AppText tone="default" variant="bodyStrong">15.000đ</AppText>
          . Số dư ví sẽ được cập nhật ngay sau khi thanh toán thành công.
        </AppText>
      )}
      errorMessage={errorMessage}
      isSubmitting={isSubmitting}
      onAmountChange={handleAmountChange}
      onClose={onClose}
      onSubmit={() => void handleStartTopup()}
      primaryButtonColor={theme.actionPrimary.val}
      primaryButtonTextColor={theme.onActionPrimary.val}
      quickAmounts={QUICK_AMOUNTS}
      submitLabel="Tiếp tục thanh toán"
      title="Nạp tiền vào ví"
      visible={visible}
    />
  );
}
