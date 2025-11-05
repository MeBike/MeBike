import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { styles } from "./styles";

type WithdrawModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    amount: string;
    bank: string;
    account: string;
    account_owner: string;
    note: string;
  }) => void;
};

export function WithdrawModal({ visible, onClose, onSubmit }: WithdrawModalProps) {
  const [formData, setFormData] = useState({
    amount: "",
    bank: "",
    account: "",
    account_owner: "",
    note: "Rút tiền từ ví",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || Number(formData.amount) < 10000) {
      newErrors.amount = "Số tiền tối thiểu là 10,000 VND";
    }

    if (!formData.bank.trim()) {
      newErrors.bank = "Vui lòng nhập tên ngân hàng";
    }

    if (!formData.account.trim()) {
      newErrors.account = "Vui lòng nhập số tài khoản";
    }

    if (!formData.account_owner.trim()) {
      newErrors.account_owner = "Vui lòng nhập tên chủ tài khoản";
    }

    if (formData.note.length < 10 || formData.note.length > 500) {
      newErrors.note = "Ghi chú phải từ 10-500 ký tự";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      amount: "",
      bank: "",
      account: "",
      account_owner: "",
      note: "Rút tiền từ ví",
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.overlay}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Rút tiền</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Text style={{ fontSize: 18, color: "#666" }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Số tiền (VND)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập số tiền"
                  keyboardType="numeric"
                  value={formData.amount}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, amount: text }))}
                />
                {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Tên ngân hàng</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ví dụ: Vietcombank, BIDV..."
                  value={formData.bank}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, bank: text }))}
                />
                {errors.bank && <Text style={styles.errorText}>{errors.bank}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Số tài khoản</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập số tài khoản"
                  keyboardType="numeric"
                  value={formData.account}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, account: text }))}
                />
                {errors.account && <Text style={styles.errorText}>{errors.account}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Chủ tài khoản</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập tên chủ tài khoản"
                  value={formData.account_owner}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, account_owner: text }))}
                />
                {errors.account_owner && <Text style={styles.errorText}>{errors.account_owner}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Ghi chú</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Nhập ghi chú (10-500 ký tự)"
                  multiline
                  numberOfLines={3}
                  value={formData.note}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, note: text }))}
                />
                {errors.note && <Text style={styles.errorText}>{errors.note}</Text>}
              </View>
            </ScrollView>

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleClose}>
                <Text style={styles.cancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.submitButton]} onPress={handleSubmit}>
                <Text style={styles.submitText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}