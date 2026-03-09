import { walletTopupErrorMessage, walletTopupService } from "@services/wallet-topup.service";
import {
  initPaymentSheet,
  PaymentSheetError,
  presentPaymentSheet,
} from "@stripe/stripe-react-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { hasStripePublishableKey, STRIPE_RETURN_URL } from "../../../lib/stripe";
import { styles } from "./styles";

type QRModalProps = {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => Promise<void> | void;
};

export function QRModal({ visible, onClose, onSuccess }: QRModalProps) {
  const [amount, setAmount] = useState("5000");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStartTopup = useCallback(async () => {
    if (!hasStripePublishableKey()) {
      Alert.alert(
        "Chưa cấu hình Stripe",
        "Cần thiết lập EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY và build lại dev client trước khi nạp tiền.",
      );
      return;
    }

    const trimmed = amount.trim();
    if (!/^\d+$/.test(trimmed)) {
      Alert.alert("Số tiền không hợp lệ", "Vui lòng nhập số tiền bằng VND.");
      return;
    }

    if (Number(trimmed) < 5000) {
      Alert.alert("Số tiền quá nhỏ", "Số tiền tối thiểu là 5.000 VND.");
      return;
    }

    setIsSubmitting(true);
    const result = await walletTopupService.createStripePaymentSheet({
      amount: trimmed,
      currency: "vnd",
    });

    if (!result.ok) {
      setIsSubmitting(false);
      Alert.alert("Không thể tạo phiên thanh toán", walletTopupErrorMessage(result.error));
      return;
    }

    const initialized = await initPaymentSheet({
      merchantDisplayName: "MeBike",
      paymentIntentClientSecret: result.value.paymentIntentClientSecret,
      returnURL: STRIPE_RETURN_URL,
    });

    if (initialized.error) {
      setIsSubmitting(false);
      Alert.alert("Không thể khởi tạo thanh toán", initialized.error.message);
      return;
    }

    const presented = await presentPaymentSheet();
    setIsSubmitting(false);

    if (presented.error) {
      if (presented.error.code === PaymentSheetError.Canceled) {
        return;
      }

      Alert.alert("Thanh toán thất bại", presented.error.message);
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
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: "padding", android: undefined })}
          style={styles.content}
        >
          <Text style={styles.title}>Nạp tiền bằng Stripe (dev)</Text>
          <Text style={styles.instruction}>
            Nhập số tiền bằng VND. Số tiền tối thiểu là 5.000 VND.
          </Text>
          <Text style={styles.instruction}>
            Sau khi thanh toán thành công, số dư ví sẽ được cập nhật trong giây lát.
          </Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="number-pad"
            placeholder="5000"
            style={styles.amountInput}
          />

          <TouchableOpacity
            style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
            onPress={handleStartTopup}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryText}>Mở Stripe PaymentSheet</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Đóng</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
