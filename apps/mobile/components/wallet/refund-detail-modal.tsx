import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";

import { refundDetailModalStyles as styles } from "../../styles/wallet/refundDetailModal";
import { formatCurrency, formatDate, truncateId } from "../../utils/wallet/formatters";

type RefundRequest = {
  _id: string;
  amount: number;
  transaction_id: string;
  status: string;
  created_at: string;
};

type RefundDetailModalProps = {
  visible: boolean;
  onClose: () => void;
  refund: RefundRequest | null;
};

export function RefundDetailModal({
  visible,
  onClose,
  refund,
}: RefundDetailModalProps) {
  if (!refund)
    return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Chi tiết hoàn tiền</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Mã yêu cầu:</Text>
            <Text style={styles.value}>{refund._id}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Số tiền hoàn:</Text>
            <Text style={styles.amount}>{formatCurrency(refund.amount.toString())}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Giao dịch gốc:</Text>
            <Text style={styles.value}>{truncateId(refund.transaction_id)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Trạng thái:</Text>
            <Text style={styles.status}>{refund.status}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Thời gian:</Text>
            <Text style={styles.value}>{formatDate(refund.created_at)}</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}
