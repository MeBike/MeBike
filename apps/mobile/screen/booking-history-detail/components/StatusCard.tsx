import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  status: string;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "HOÀN THÀNH":
      return "#4CAF50";
    case "ĐANG THUÊ":
      return "#FF9800";
    case "ĐÃ HỦY":
      return "#F44336";
    default:
      return "#999";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "HOÀN THÀNH":
      return "Hoàn thành";
    case "ĐANG THUÊ":
      return "Đang thuê";
    case "ĐÃ HỦY":
      return "Đã hủy";
    default:
      return status;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "HOÀN THÀNH":
      return "checkmark-circle";
    case "ĐANG THUÊ":
      return "time";
    case "ĐÃ HỦY":
      return "close-circle";
    default:
      return "help-circle";
  }
};

const StatusCard = ({ status }: Props) => {
  return (
    <View style={styles.statusCard}>
      <View style={styles.statusHeader}>
        <Ionicons
          name={getStatusIcon(status) as any}
          size={32}
          color={getStatusColor(status)}
        />
        <View style={styles.statusInfo}>
          <Text style={styles.statusTitle}>Trạng thái</Text>
          <Text
            style={[styles.statusText, { color: getStatusColor(status) }]}
          >
            {getStatusText(status)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statusCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusInfo: {
    marginLeft: 16,
    flex: 1,
  },
  statusTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  statusText: {
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default StatusCard;
