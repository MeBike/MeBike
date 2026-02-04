import { walletTopupErrorMessage, walletTopupService } from "@services/wallet-topup.service";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { styles } from "./styles";

type QRModalProps = {
  visible: boolean;
  onClose: () => void;
  userId: string;
};

export function QRModal({ visible, onClose, userId }: QRModalProps) {
  const [amount, setAmount] = useState("5000");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const successUrl = useMemo(
    () => `https://example.com/stripe-success?userId=${encodeURIComponent(userId)}`,
    [userId],
  );

  const cancelUrl = useMemo(
    () => `https://example.com/stripe-cancel?userId=${encodeURIComponent(userId)}`,
    [userId],
  );

  const handleStartTopup = useCallback(async () => {
    const trimmed = amount.trim();
    if (!/^\d+$/.test(trimmed)) {
      Alert.alert("So tien khong hop le", "Vui long nhap so tien dang so (don vi cent). ");
      return;
    }

    if (Number(trimmed) < 5000) {
      Alert.alert("So tien qua nho", "So tien toi thieu la 5000 (don vi cent). ");
      return;
    }

    setIsSubmitting(true);
    const result = await walletTopupService.createStripeCheckoutSession({
      amount: trimmed,
      currency: "usd",
      successUrl,
      cancelUrl,
    });
    setIsSubmitting(false);

    if (!result.ok) {
      Alert.alert("Khong the tao phien thanh toan", walletTopupErrorMessage(result.error));
      return;
    }

    onClose();
    try {
      await Linking.openURL(result.value.checkoutUrl);
    }
    catch {
      Alert.alert("Khong the mo trinh duyet", "Vui long thu lai sau.");
    }
  }, [amount, cancelUrl, onClose, successUrl]);

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
            Nhap so tien theo don vi cent (USD). Toi thieu 5000.
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
              : <Text style={styles.primaryText}>Mo Stripe Checkout</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Dong</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
