import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

const LoadingState = () => {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#0066FF" />
      <Text style={styles.loadingText}>Đang tải chi tiết...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
});

export default LoadingState;
