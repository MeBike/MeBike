import { IconSymbol } from "@components/IconSymbol";
import { AppText } from "@ui/primitives/app-text";
import { formatTransactionStatus } from "@utils/wallet/formatters";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal, Pressable, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "tamagui";

import type { Transaction } from "./types";

import { DetailRow } from "./detail-row";
import {
  formatDetailDate,
  formatDisplayAmount,
  getStatusTone,
  humanizeTransactionTitle,
  toShortReference,
} from "./helpers";
import { createTransactionDetailModalStyles } from "./styles";

type TransactionDetailModalProps = {
  visible: boolean;
  onClose: () => void;
  transaction: Transaction | null;
};

const SHEET_OPEN_DURATION = 260;
const SHEET_CLOSE_DURATION = 220;

export function TransactionDetailModal({
  visible,
  onClose,
  transaction,
}: TransactionDetailModalProps) {
  const theme = useTheme();
  const themePalette = useMemo(() => ({
    overlayScrim: theme.overlayScrim.val,
    surfaceDefault: theme.surfaceDefault.val,
    shadowColor: theme.shadowColor.val,
    borderDefault: theme.borderDefault.val,
    surfaceMuted: theme.surfaceMuted.val,
    textSecondary: theme.textSecondary.val,
    textPrimary: theme.textPrimary.val,
    statusSuccess: theme.statusSuccess.val,
    statusWarning: theme.statusWarning.val,
    statusDanger: theme.statusDanger.val,
  }), [
    theme.borderDefault.val,
    theme.overlayScrim.val,
    theme.shadowColor.val,
    theme.statusDanger.val,
    theme.statusSuccess.val,
    theme.statusWarning.val,
    theme.surfaceDefault.val,
    theme.surfaceMuted.val,
    theme.textPrimary.val,
    theme.textSecondary.val,
  ]);
  const styles = useMemo(() => createTransactionDetailModalStyles(themePalette), [themePalette]);
  const [showFullReference, setShowFullReference] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const backdropOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(420);

  useEffect(() => {
    if (!visible || !transaction) {
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
  }, [backdropOpacity, sheetTranslateY, transaction, visible]);

  useEffect(() => {
    if (!visible) {
      setShowFullReference(false);
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  const closeWithAnimation = useCallback(() => {
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
  }, [backdropOpacity, onClose, sheetTranslateY]);

  if (!visible || !transaction) {
    return null;
  }

  const statusTone = getStatusTone(transaction.status);
  const shortReference = toShortReference(transaction, showFullReference);
  const detailTitle = humanizeTransactionTitle(transaction);
  const amountText = formatDisplayAmount(transaction);

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

        <Animated.View style={[styles.sheet, sheetStyle]}>
          <View style={styles.sheetHandle} />

          <View style={styles.headerRow}>
            <AppText variant="title">Chi tiết giao dịch</AppText>

            <Pressable onPress={closeWithAnimation} style={({ pressed }) => [styles.closeButton, pressed ? styles.closeButtonPressed : null]}>
              <IconSymbol color={theme.textSecondary.val} name="close" size="input" />
            </Pressable>
          </View>

          <View style={styles.heroBlock}>
            <AppText adjustsFontSizeToFit align="center" numberOfLines={1} style={styles.heroAmount}>
              {amountText}
            </AppText>

            <AppText align="center" numberOfLines={2} style={styles.heroTitle}>
              {detailTitle}
            </AppText>
          </View>

          <View style={styles.block}>
            <View style={styles.divider} />

            <DetailRow
              copyIconColor={theme.textTertiary.val}
              label="Trạng thái"
              styles={styles}
              value={formatTransactionStatus(transaction.status)}
              valueTone={statusTone}
            />

            <View style={styles.rowDivider} />

            <DetailRow copyIconColor={theme.textTertiary.val} label="Thời gian" styles={styles} value={formatDetailDate(transaction.createdAt)} />

            <View style={styles.rowDivider} />

            <DetailRow copyIconColor={theme.textTertiary.val} label="Nguồn tiền" styles={styles} value="Ví MeBike" />

            <View style={styles.rowDivider} />

            <DetailRow
              copyIconColor={theme.textTertiary.val}
              expanded={showFullReference}
              label="Mã giao dịch"
              onToggle={() => setShowFullReference(value => !value)}
              showToggle
              styles={styles}
              value={shortReference}
            />

            <View style={styles.rowDivider} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
