import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

type ActionButtonsProps = {
  isPending: boolean;
  isConfirming: boolean;
  isCancelling: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ActionButtons({
  isPending,
  isConfirming,
  isCancelling,
  onConfirm,
  onCancel,
}: ActionButtonsProps) {
  return (
    <View style={{ flexDirection: "column", gap: 12 }}>
      <TouchableOpacity
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 14,
            borderRadius: 12,
          },
          { backgroundColor: "#F44336" },
          !isPending && { opacity: 0.6 },
        ]}
        onPress={onCancel}
        disabled={!isPending || isCancelling}
      >
        {isCancelling
          ? (
              <ActivityIndicator size="small" color="#fff" />
            )
          : (
              <>
                <Ionicons name="close-circle" size={18} color="#fff" />
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>
                  Huỷ đặt trước
                </Text>
              </>
            )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 14,
            borderRadius: 12,
          },
          { backgroundColor: "#0066FF" },
          !isPending && { opacity: 0.6 },
        ]}
        onPress={onConfirm}
        disabled={!isPending || isConfirming}
      >
        {isConfirming
          ? (
              <ActivityIndicator size="small" color="#fff" />
            )
          : (
              <>
                <Ionicons name="play" size={18} color="#fff" />
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>
                  Xác nhận & bắt đầu
                </Text>
              </>
            )}
      </TouchableOpacity>
    </View>
  );
}
