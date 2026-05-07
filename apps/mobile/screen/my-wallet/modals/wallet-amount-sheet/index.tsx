import type { ReactNode } from "react";

import { IconSymbol } from "@components/IconSymbol";
import { AppText } from "@ui/primitives/app-text";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
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

import { createWalletAmountSheetStyles } from "./styles";

type WalletAmountSheetProps = {
  amount: string;
  currencyLabel?: string;
  description: ReactNode;
  errorMessage?: string | null;
  helperText?: ReactNode;
  isSubmitting: boolean;
  onAmountChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  primaryButtonColor: string;
  primaryButtonTextColor: string;
  quickAmounts: readonly string[];
  submitLabel: string;
  title: string;
  visible: boolean;
};

const SHEET_OPEN_DURATION = 260;
const SHEET_CLOSE_DURATION = 220;

export function WalletAmountSheet({
  amount,
  currencyLabel = "VND",
  description,
  errorMessage,
  helperText,
  isSubmitting,
  onAmountChange,
  onClose,
  onSubmit,
  primaryButtonColor,
  primaryButtonTextColor,
  quickAmounts,
  submitLabel,
  title,
  visible,
}: WalletAmountSheetProps) {
  const theme = useTheme();
  const themePalette = useMemo(() => ({
    overlayScrim: theme.overlayScrim.val,
    surfaceDefault: theme.surfaceDefault.val,
    borderDefault: theme.borderDefault.val,
    surfaceMuted: theme.surfaceMuted.val,
    actionPrimary: theme.actionPrimary.val,
    textPrimary: theme.textPrimary.val,
    textSecondary: theme.textSecondary.val,
    textTertiary: theme.textTertiary.val,
    textDanger: theme.textDanger.val,
    shadowColor: theme.shadowColor.val,
  }), [
    theme.actionPrimary.val,
    theme.borderDefault.val,
    theme.overlayScrim.val,
    theme.shadowColor.val,
    theme.surfaceDefault.val,
    theme.surfaceMuted.val,
    theme.textDanger.val,
    theme.textPrimary.val,
    theme.textSecondary.val,
    theme.textTertiary.val,
  ]);
  const styles = useMemo(() => createWalletAmountSheetStyles(themePalette), [themePalette]);
  const [isAmountFocused, setIsAmountFocused] = useState(false);
  const [isMounted, setIsMounted] = useState(visible);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const backdropOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(420);

  useEffect(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (visible) {
      setIsMounted(true);
      backdropOpacity.value = withTiming(1, {
        duration: SHEET_OPEN_DURATION,
        easing: Easing.out(Easing.cubic),
      });
      sheetTranslateY.value = withTiming(0, {
        duration: SHEET_OPEN_DURATION,
        easing: Easing.out(Easing.cubic),
      });
      return;
    }

    if (!isMounted) {
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
      setIsMounted(false);
    }, SHEET_CLOSE_DURATION);
  }, [backdropOpacity, isMounted, sheetTranslateY, visible]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const formattedQuickAmounts = useMemo(
    () => quickAmounts.map(value => ({ label: Number(value).toLocaleString("vi-VN"), value })),
    [quickAmounts],
  );
  const displayAmount = useMemo(() => (amount ? Number(amount).toLocaleString("vi-VN") : ""), [amount]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  const handleAmountChange = useCallback((value: string) => {
    onAmountChange(value.replace(/\D/g, ""));
  }, [onAmountChange]);

  const handleRequestClose = useCallback(() => {
    if (isSubmitting) {
      return;
    }

    onClose();
  }, [isSubmitting, onClose]);

  if (!isMounted) {
    return null;
  }

  return (
    <Modal animationType="none" onRequestClose={handleRequestClose} transparent visible>
      <View style={styles.overlayShell}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable onPress={handleRequestClose} style={styles.backdropPressable} />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.select({ ios: "padding", android: undefined })}
          style={styles.sheetHost}
        >
          <Animated.View style={[styles.sheet, sheetStyle]}>
            <View style={styles.sheetHandle} />

            <View style={styles.headerRow}>
              <AppText variant="xlTitle">{title}</AppText>

              <Pressable onPress={handleRequestClose} style={({ pressed }) => [styles.closeButton, pressed ? styles.closeButtonPressed : null]}>
                <IconSymbol color={theme.textSecondary.val} name="close" size="input" />
              </Pressable>
            </View>

            <View style={styles.description}>
              {typeof description === "string"
                ? <AppText tone="muted" variant="bodySmall">{description}</AppText>
                : description}
            </View>

            <View style={[
              styles.amountField,
              isAmountFocused ? styles.amountFieldFocused : null,
              errorMessage ? styles.amountFieldError : null,
            ]}
            >
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
              <AppText tone="muted" variant="sectionTitle">{currencyLabel}</AppText>
            </View>

            {errorMessage
              ? (
                  <AppText style={styles.feedbackText} tone="danger" variant="bodySmall">
                    {errorMessage}
                  </AppText>
                )
              : null}

            {helperText
              ? (
                  <View>
                    {typeof helperText === "string"
                      ? <AppText style={styles.helperText} tone="muted" variant="bodySmall">{helperText}</AppText>
                      : helperText}
                  </View>
                )
              : null}

            <View style={styles.quickAmountsRow}>
              {formattedQuickAmounts.map((quickAmount) => {
                const isActive = amount === quickAmount.value;

                return (
                  <Pressable
                    key={quickAmount.value}
                    onPress={() => onAmountChange(quickAmount.value)}
                    style={({ pressed }) => [
                      styles.quickAmountChip,
                      { backgroundColor: isActive ? primaryButtonColor : theme.surfaceDefault.val, borderColor: isActive ? primaryButtonColor : theme.borderDefault.val },
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
              onPress={onSubmit}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: primaryButtonColor, shadowColor: primaryButtonColor },
                pressed ? styles.primaryButtonPressed : null,
                isSubmitting ? styles.primaryButtonDisabled : null,
              ]}
            >
              {isSubmitting
                ? <ActivityIndicator color={primaryButtonTextColor} />
                : <AppText style={{ color: primaryButtonTextColor }} variant="sectionTitle">{submitLabel}</AppText>}
            </Pressable>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
