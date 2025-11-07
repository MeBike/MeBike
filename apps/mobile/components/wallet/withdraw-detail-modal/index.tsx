import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";

import { formatCurrency, formatDate } from "../../../utils/wallet/formatters";
import { styles } from "./styles";

type WithdrawRequest = {
  _id: string;
  amount: number;
  bank: string;
  account: string;
  account_owner: string;
  status: string;
  created_at: string;
  note?: string;
};

type WithdrawDetailModalProps = {
  visible: boolean;
  onClose: () => void;
  withdrawal: WithdrawRequest | null;
};

export function WithdrawDetailModal({
  visible,
  onClose,
  withdrawal,
}: WithdrawDetailModalProps) {
  if (!withdrawal)
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
            <Text style={styles.title}>Chi tiết rút tiền</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Mã yêu cầu:</Text>
            <Text style={styles.value}>{withdrawal._id}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Số tiền:</Text>
            <Text style={styles.amount}>
              {formatCurrency(withdrawal.amount.toString())}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Ngân hàng:</Text>
            <Text style={styles.value}>{withdrawal.bank}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Số tài khoản:</Text>
            <Text style={styles.value}>{withdrawal.account}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Chủ tài khoản:</Text>
            <Text style={styles.value}>{withdrawal.account_owner}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Trạng thái:</Text>
            <Text style={styles.status}>{withdrawal.status}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Thời gian:</Text>
            <Text style={styles.value}>
              {formatDate(withdrawal.created_at)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Ghi chú:</Text>
            <Text style={styles.value}>
              {withdrawal.note}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}
