import DateTimePicker from "@react-native-community/datetimepicker";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { BikeColors } from "@constants/BikeColors";

import { formatTime } from "../editorUtils";

export type TimePickerModalProps = {
  visible: boolean;
  value: Date;
  onChange: (event: any, date?: Date) => void;
  onConfirm: () => void;
  onClose: () => void;
};

export function TimePickerModal({ visible, value, onChange, onConfirm, onClose }: TimePickerModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Chọn giờ bắt đầu</Text>
          <DateTimePicker
            mode="time"
            display="spinner"
            value={value}
            is24Hour
            onChange={onChange}
          />
          <Text style={styles.preview}>Giờ đã chọn: {formatTime(value)}</Text>
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
  preview: {
    color: BikeColors.textSecondary,
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
