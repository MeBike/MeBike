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

export function TransactionDetailModal({
  visible,
  onClose,
  transaction,
}: TransactionDetailModalProps) {
  if (!transaction)
    return null;

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
            <Text style={styles.label}>Mã giao dịch:</Text>
            <Text style={styles.value}>{transaction.id}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Loại:</Text>
            <Text style={styles.value}>{formatTransactionType(transaction.type)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Số tiền:</Text>
            <Text style={styles.amount}>
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
