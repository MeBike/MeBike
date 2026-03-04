import { BikeColors } from "@constants/BikeColors";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: BikeColors.textPrimary,
  },
  iosPicker: {
    width: "100%",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 12,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: BikeColors.surface,
  },
  modalButtonText: {
    color: BikeColors.textPrimary,
    fontWeight: "600",
  },
  modalPrimaryButton: {
    backgroundColor: BikeColors.primary,
  },
  modalPrimaryText: {
    color: "#fff",
  },
});

type IosDateTimeModalProps = {
  visible: boolean;
  value: Date;
  minimumDate: Date;
  onClose: () => void;
  onChange: (date: Date) => void;
  onConfirm: () => void;
};

export function IosDateTimeModal({
  visible,
  value,
  minimumDate,
  onClose,
  onChange,
  onConfirm,
}: IosDateTimeModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Chọn thời gian giữ xe</Text>
          <DateTimePicker
            display="spinner"
            mode="datetime"
            value={value}
            minimumDate={minimumDate}
            onChange={(_, date) => {
              if (date)
                onChange(date);
            }}
            style={styles.iosPicker}
          />
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={onClose}
            >
              <Text style={styles.modalButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalPrimaryButton]}
              onPress={onConfirm}
            >
              <Text style={[styles.modalButtonText, styles.modalPrimaryText]}>
                Xác nhận
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
