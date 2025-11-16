import React, { useMemo, useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";

import type { StationType } from "../../../types/StationType";
import type { RentalDetail } from "../../../types/RentalTypes";

type Props = {
  booking: RentalDetail;
  stations: StationType[];
  isSubmitting: boolean;
  onSubmit: (payload: { end_station: string; reason: string }) => void;
};

const DEFAULT_REASON = "Kết thúc phiên thuê bởi nhân viên";

function StaffEndRentalCard({ booking, stations, isSubmitting, onSubmit }: Props) {
  const [selectedStation, setSelectedStation] = useState<string>("");
  const [reason, setReason] = useState(DEFAULT_REASON);

  useEffect(() => {
    if (!selectedStation) {
      const fallbackStation =
        booking.end_station?._id || booking.start_station?._id || stations[0]?._id || "";
      setSelectedStation(fallbackStation);
    }
  }, [booking, stations, selectedStation]);

  const stationOptions = useMemo(
    () =>
      stations.map((station) => ({
        label: station.name,
        value: station._id,
      })),
    [stations],
  );

  const handleConfirm = () => {
    if (!selectedStation) {
      Alert.alert("Thiếu thông tin", "Vui lòng chọn trạm kết thúc.");
      return;
    }
    onSubmit({
      end_station: selectedStation,
      reason: reason.trim() ? reason.trim() : DEFAULT_REASON,
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="briefcase" size={20} color="#0066FF" />
        <Text style={styles.cardTitle}>Kết thúc phiên cho khách</Text>
      </View>
      <Text style={styles.cardSubtitle}>
        Chọn trạm khách trả xe và xác nhận để đóng phiên đang hoạt động.
      </Text>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Trạm kết thúc</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={selectedStation}
            onValueChange={(value) => setSelectedStation(value)}
          >
            <Picker.Item label="Chọn trạm..." value="" enabled={false} />
            {stationOptions.map((option) => (
              <Picker.Item
                key={option.value}
                label={option.label}
                value={option.value}
              />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Ghi chú</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Ví dụ: Khách trả xe tại quầy B2"
          value={reason}
          onChangeText={setReason}
          multiline
        />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]}
        onPress={handleConfirm}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
            <Text style={styles.submitText}>Xác nhận kết thúc phiên</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2A44",
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#5B6785",
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3E4C6D",
    marginBottom: 6,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#E0E6F5",
    borderRadius: 12,
    overflow: "hidden",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#E0E6F5",
    borderRadius: 12,
    padding: 12,
    minHeight: 70,
    textAlignVertical: "top",
    fontSize: 14,
    color: "#1F2A44",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    backgroundColor: "#0066FF",
    paddingVertical: 16,
  },
  submitText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});

export default StaffEndRentalCard;
