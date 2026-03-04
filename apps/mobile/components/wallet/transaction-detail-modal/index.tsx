import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";

import { formatCurrency, formatDate, formatTransactionStatus, formatTransactionType } from "../../../utils/wallet/formatters";
import { styles } from "./styles";

type Transaction = {
  id: string;
  amount: string;
  description?: string | null;
  type: string;
  status: string;
  createdAt: string;
};

type TransactionDetailModalProps = {
  visible: boolean;
  onClose: () => void;
  transaction: Transaction | null;
};

function toShortReference(id: string) {
  if (!id) {
    return "";
  }

  if (id.length <= 14) {
    return id;
  }

  return `${id.slice(0, 8)}...${id.slice(-6)}`;
}

export function TransactionDetailModal({
  visible,
  onClose,
  transaction,
}: TransactionDetailModalProps) {
  const [showFullReference, setShowFullReference] = React.useState(false);

  if (!transaction)
    return null;

  const typeUpper = (transaction.type || "").toUpperCase();
  const isMoneyOut = typeUpper === "DEBIT";
  const amountPrefix = isMoneyOut ? "-" : "+";
  const shortReference = toShortReference(transaction.id);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Chi tiết giao dịch</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Mã tham chiếu:</Text>
            <View style={styles.idValueContainer}>
              <Text
                style={styles.value}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {shortReference}
              </Text>
              <TouchableOpacity
                onPress={() => setShowFullReference(value => !value)}
                style={styles.copyButton}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={showFullReference ? "eye-off-outline" : "eye-outline"}
                  size={16}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>
          </View>

          {showFullReference && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Mã đầy đủ:</Text>
              <Text style={styles.value} selectable>
                {transaction.id}
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.label}>Loại:</Text>
            <Text style={styles.value}>{formatTransactionType(transaction.type)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Số tiền:</Text>
            <Text style={[styles.amount, isMoneyOut ? styles.amountOut : styles.amountIn]}>
              {amountPrefix}
              {formatCurrency(transaction.amount)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Trạng thái:</Text>
            <Text style={styles.status}>{formatTransactionStatus(transaction.status)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Thời gian:</Text>
            <Text style={styles.value}>
              {formatDate(transaction.createdAt)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Mô tả:</Text>
            <Text style={styles.value}>{transaction.description || "-"}</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}
