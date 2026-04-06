import {
  initPaymentSheet,
  PaymentSheetError,
  presentPaymentSheet,
} from "@stripe/stripe-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  TextInput,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "tamagui";

import { presentWalletError } from "@/presenters/wallets/wallet-error-presenter";
import { IconSymbol } from "@components/IconSymbol";
import { hasStripePublishableKey, STRIPE_RETURN_URL } from "@lib/stripe";
import { walletTopupService } from "@services/wallet-topup.service";
import { AppText } from "@ui/primitives/app-text";

import { createQrModalStyles } from "./styles";

type QRModalProps = {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => Promise<void> | void;
};

const QUICK_AMOUNTS = ["50000", "100000", "200000", "500000"] as const;
const SHEET_OPEN_DURATION = 260;
const SHEET_CLOSE_DURATION = 220;

export function QRModal({ visible, onClose, onSuccess }: QRModalProps) {
  const theme = useTheme();
  const themePalette = useMemo(() => ({
    overlayScrim: theme.overlayScrim.val,
    surfaceDefault: theme.surfaceDefault.val,
    borderDefault: theme.borderDefault.val,
    surfaceMuted: theme.surfaceMuted.val,
    actionPrimary: theme.actionPrimary.val,
    surfaceAccent: theme.surfaceAccent.val,
    textPrimary: theme.textPrimary.val,
    shadowColor: theme.shadowColor.val,
    onActionPrimary: theme.onActionPrimary.val,
  }), [
    theme.actionPrimary.val,
    theme.borderDefault.val,
    theme.onActionPrimary.val,
    theme.overlayScrim.val,
    theme.shadowColor.val,
    theme.surfaceAccent.val,
    theme.surfaceDefault.val,
    theme.surfaceMuted.val,
    theme.textPrimary.val,
  ]);
  const styles = useMemo(() => createQrModalStyles(themePalette), [themePalette]);
  const [amount, setAmount] = useState("50000");
  const [isAmountFocused, setIsAmountFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const backdropOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(420);

  useEffect(() => {
    if (!visible) {
      return;
    }

    backdropOpacity.value = withTiming(1, {
      duration: SHEET_OPEN_DURATION,
      easing: Easing.out(Easing.cubic),
    });
    sheetTranslateY.value = withTiming(0, {
      duration: SHEET_OPEN_DURATION,
      easing: Easing.out(Easing.cubic),
    });

    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [backdropOpacity, sheetTranslateY, visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  const closeWithAnimation = useCallback(() => {
    if (isSubmitting) {
      return;
    }

    backdropOpacity.value = withTiming(0, {
      duration: SHEET_CLOSE_DURATION,
      easing: Easing.inOut(Easing.cubic),
    });
    sheetTranslateY.value = withTiming(420, {
      duration: SHEET_CLOSE_DURATION,
      easing: Easing.inOut(Easing.cubic),
    });

    closeTimerRef.current = setTimeout(() => {
      onClose();
    }, SHEET_CLOSE_DURATION);
  }, [backdropOpacity, isSubmitting, onClose, sheetTranslateY]);

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
      Alert.alert("Không thể tạo phiên thanh toán", presentWalletError(result.error));
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

    closeWithAnimation();
    try {
      await onSuccess?.();
    }
    catch {
      // Ignore wallet refresh failures; webhook remains source of truth.
    }
  }, [amount, closeWithAnimation, onSuccess]);

  const formattedQuickAmounts = useMemo(
    () => QUICK_AMOUNTS.map(value => ({ label: Number(value).toLocaleString("vi-VN"), value })),
    [],
  );
  const displayAmount = useMemo(
    () => (amount ? Number(amount).toLocaleString("vi-VN") : ""),
    [amount],
  );
  const handleAmountChange = useCallback((value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    setAmount(digitsOnly);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <Modal
      animationType="none"
      onRequestClose={closeWithAnimation}
      transparent
      visible={visible}
    >
      <View style={styles.overlayShell}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable onPress={closeWithAnimation} style={styles.backdropPressable} />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.select({ ios: "padding", android: undefined })}
          style={styles.sheetHost}
        >
          <Animated.View style={[styles.sheet, sheetStyle]}>
            <View style={styles.sheetHandle} />

            <View style={styles.headerRow}>
              <AppText variant="xlTitle">Nạp tiền vào ví</AppText>

              <Pressable onPress={closeWithAnimation} style={({ pressed }) => [styles.closeButton, pressed ? styles.closeButtonPressed : null]}>
                <IconSymbol color={theme.textSecondary.val} name="xmark" size={18} />
              </Pressable>
            </View>

            <AppText style={styles.description} tone="muted" variant="bodySmall">
              Nhập số tiền bằng VND. Số tiền tối thiểu là
              {" "}
              <AppText tone="default" variant="bodyStrong">5.000đ</AppText>
              . Số dư ví sẽ được cập nhật ngay sau khi thanh toán thành công.
            </AppText>

            <View style={[styles.amountField, isAmountFocused ? styles.amountFieldFocused : null]}>
              <TextInput
                keyboardType="number-pad"
                onBlur={() => setIsAmountFocused(false)}
                onChangeText={handleAmountChange}
                onFocus={() => setIsAmountFocused(true)}
                placeholder="0"
                placeholderTextColor={theme.textTertiary.val}
                style={styles.amountInput}
                value={displayAmount}
              />
              <AppText tone="muted" variant="sectionTitle">VND</AppText>
            </View>

            <View style={styles.quickAmountsRow}>
              {formattedQuickAmounts.map((quickAmount) => {
                const isActive = amount === quickAmount.value;

                return (
                  <Pressable
                    key={quickAmount.value}
                    onPress={() => setAmount(quickAmount.value)}
                    style={({ pressed }) => [
                      styles.quickAmountChip,
                      isActive ? styles.quickAmountChipActive : null,
                      pressed ? styles.quickAmountChipPressed : null,
                    ]}
                  >
                    <AppText tone={isActive ? "inverted" : "muted"} variant="bodyStrong">
                      {quickAmount.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              disabled={isSubmitting}
              onPress={handleStartTopup}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed ? styles.primaryButtonPressed : null,
                isSubmitting ? styles.primaryButtonDisabled : null,
              ]}
            >
              {isSubmitting
                ? <ActivityIndicator color={theme.onActionPrimary.val} />
                : <AppText tone="inverted" variant="sectionTitle">Mở Stripe PaymentSheet</AppText>}
            </Pressable>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
