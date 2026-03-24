import { IconSymbol } from "@components/IconSymbol";
import { colors } from "@theme/colors";
import { AppText } from "@ui/primitives/app-text";
import {
  formatCurrency,
  formatDate,
  formatTransactionStatus,
  formatTransactionType,
} from "@utils/wallet/formatters";
import { useCallback, useEffect, useRef, useState } from "react";
import { Modal, Pressable, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { styles } from "./styles";

type Transaction = {
  id: string;
  amount: string;
  description?: string | null;
  type: string;
  status: string;
  createdAt: string;
  hash?: string | null;
};

type TransactionDetailModalProps = {
  visible: boolean;
  onClose: () => void;
  transaction: Transaction | null;
};

const SHEET_OPEN_DURATION = 260;
const SHEET_CLOSE_DURATION = 220;

function toShortReference(transaction: Transaction) {
  const reference = transaction.hash || transaction.id;
  if (!reference) {
    return "--";
  }

  if (reference.length <= 16) {
    return reference;
  }

  return `${reference.slice(0, 8)}...${reference.slice(-6)}`;
}

function getStatusTone(status: string): "success" | "warning" | "danger" | "default" {
  switch (status.toUpperCase()) {
    case "SUCCESS":
      return "success";
    case "PENDING":
      return "warning";
    case "FAILED":
      return "danger";
    default:
      return "default";
  }
}

function DetailRow({
  label,
  value,
  valueTone = "default",
  strong = false,
  showToggle = false,
  onToggle,
}: {
  label: string;
  value: string;
  valueTone?: "success" | "warning" | "danger" | "default";
  strong?: boolean;
  showToggle?: boolean;
  onToggle?: () => void;
}) {
  return (
    <View style={styles.row}>
      <AppText style={styles.label} variant="body">
        {label}
      </AppText>

      <View style={styles.valueGroup}>
        <AppText
          style={[
            styles.value,
            strong ? styles.valueStrong : null,
            valueTone === "success" ? styles.valueSuccess : null,
            valueTone === "warning" ? styles.valueWarning : null,
            valueTone === "danger" ? styles.valueDanger : null,
          ]}
          variant="body"
        >
          {value}
        </AppText>

        {showToggle && onToggle
          ? (
              <Pressable onPress={onToggle} style={({ pressed }) => [styles.copyButton, pressed ? styles.copyButtonPressed : null]}>
                <IconSymbol color={colors.textMuted} name="doc.on.doc" size={16} />
              </Pressable>
            )
          : null}
      </View>
    </View>
  );
}

export function TransactionDetailModal({
  visible,
  onClose,
  transaction,
}: TransactionDetailModalProps) {
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

  const typeUpper = transaction.type.toUpperCase();
  const isMoneyOut = typeUpper === "DEBIT";
  const amountPrefix = isMoneyOut ? "-" : "+";
  const statusTone = getStatusTone(transaction.status);
  const shortReference = toShortReference(transaction);

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
              <IconSymbol color={colors.textSecondary} name="xmark" size={18} />
            </Pressable>
          </View>

          <View style={styles.block}>
            <DetailRow
              label="Mã tham chiếu:"
              onToggle={() => setShowFullReference(value => !value)}
              showToggle
              value={shortReference}
            />

            {showFullReference
              ? (
                  <View style={styles.fullReferenceCard}>
                    <AppText style={styles.fullReferenceText} selectable variant="bodySmall">
                      {transaction.id}
                    </AppText>
                  </View>
                )
              : null}

            <View style={styles.divider} />

            <DetailRow label="Loại:" value={formatTransactionType(transaction.type)} />
            <DetailRow
              label="Số tiền:"
              strong
              value={`${amountPrefix}${formatCurrency(transaction.amount)}`}
              valueTone={isMoneyOut ? "default" : "success"}
            />
            <DetailRow
              label="Trạng thái:"
              strong
              value={formatTransactionStatus(transaction.status)}
              valueTone={statusTone}
            />
            <DetailRow label="Thời gian:" value={formatDate(transaction.createdAt)} />
            <DetailRow label="Mô tả:" value={transaction.description || "--"} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
