import React from "react";
import { ActivityIndicator, Text, View } from "react-native";

type LoadingStateProps = {
  message?: string;
};

export function LoadingState({ message = "Đang tải..." }: LoadingStateProps) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16 }}>
      <ActivityIndicator size="large" color="#0066FF" />
      <Text style={{ fontSize: 14, color: "#607D8B" }}>{message}</Text>
    </View>
  );
}
