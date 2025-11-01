import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type ErrorStateProps = {
  onGoBack: () => void;
  title?: string;
  message?: string;
  buttonText?: string;
};

export function ErrorState({
  onGoBack,
  title = "Không tìm thấy dữ liệu",
  message = "Dữ liệu có thể đã bị xoá hoặc không tồn tại.",
  buttonText = "Quay lại",
}: ErrorStateProps) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 12 }}>
      <Ionicons name="alert-circle" size={48} color="#F44336" />
      <Text style={{ fontSize: 20, fontWeight: "700", color: "#263238" }}>{title}</Text>
      <Text style={{ fontSize: 14, color: "#607D8B", textAlign: "center" }}>{message}</Text>
      <TouchableOpacity
        style={{
          marginTop: 8,
          backgroundColor: "#0066FF",
          paddingVertical: 12,
          paddingHorizontal: 24,
          borderRadius: 24,
        }}
        onPress={onGoBack}
      >
        <Text style={{ color: "#fff", fontWeight: "600" }}>{buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
}
