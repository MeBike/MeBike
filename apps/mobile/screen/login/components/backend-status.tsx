import { StyleSheet, Text, View } from "react-native";

import type { BackendStatus } from "../hooks/use-login";

const styles = StyleSheet.create({
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
  },
});

type BackendStatusProps = {
  backendStatus: BackendStatus;
};

function BackendStatusIndicator({ backendStatus }: BackendStatusProps) {
  const dotColor
    = backendStatus === "online"
      ? "#4CAF50"
      : backendStatus === "offline"
        ? "#F44336"
        : "#FF9800";

  const statusText
    = backendStatus === "online"
      ? "Hoạt động"
      : backendStatus === "offline"
        ? "Offline"
        : "Đang kiểm tra...";

  return (
    <View style={styles.statusContainer}>
      <View
        style={[
          styles.statusDot,
          { backgroundColor: dotColor },
        ]}
      />
      <Text style={styles.statusText}>
        Server:
        {" "}
        {statusText}
      </Text>
    </View>
  );
}

export default BackendStatusIndicator;
