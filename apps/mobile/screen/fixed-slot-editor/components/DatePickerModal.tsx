import DateTimePicker from "@react-native-community/datetimepicker";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { BikeColors } from "@constants/BikeColors";

import { getTomorrowDate } from "../editorUtils";

type Props = {
  visible: boolean;
  value: Date;
  onChange: (event: any, date?: Date) => void;
  onConfirm: () => void;
  onClose: () => void;
};

export function DatePickerModal({ visible, value, onChange, onConfirm, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Chọn ngày áp dụng</Text>
          <DateTimePicker
            mode="date"
            display="spinner"
            value={value}
            minimumDate={getTomorrowDate()}
            onChange={onChange}
          />
          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.linkText}>Đóng</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm}>
              <Text style={styles.linkText}>Chọn</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    padding: 24,
  },
  container: {
    borderRadius: 20,
    backgroundColor: "#fff",
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: BikeColors.textPrimary,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  linkText: {
    color: BikeColors.primary,
    fontWeight: "600",
  },
});
