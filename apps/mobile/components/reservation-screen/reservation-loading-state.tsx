import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

type LoadingStateProps = {
  message?: string;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#607D8B",
  },
  inlineLoader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  inlineLoaderText: {
    fontSize: 13,
    color: "#607D8B",
  },
});

export function ReservationLoadingState({ message = "Đang tải dữ liệu..." }: LoadingStateProps) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#0066FF" />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

export function ReservationInlineLoader() {
  return (
    <View style={styles.inlineLoader}>
      <ActivityIndicator size="small" color="#0066FF" />
      <Text style={styles.inlineLoaderText}>Đang cập nhật...</Text>
    </View>
  );
}
