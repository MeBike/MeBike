import React, { useState } from "react";
import {
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { styles } from "./styles";

type TopUpModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
};

export function TopUpModal({ visible, onClose, onConfirm }: TopUpModalProps) {
  const [amount, setAmount] = useState("");

  const handleConfirm = () => {
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      alert("Vui lòng nhập số tiền hợp lệ");
      return;
    }
    onConfirm(numAmount);
    setAmount("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Nạp tiền vào ví</Text>
          
          <Text style={styles.label}>Nhập số tiền nạp (VNĐ)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ví dụ: 50000"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            autoFocus
          />

          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmButtonText}>Tiếp tục</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Hủy</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
