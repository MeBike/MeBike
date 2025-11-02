import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ReservationHeaderProps = {
  canGoBack: boolean;
  onGoBack: () => void;
};

export function ReservationHeader({ canGoBack, onGoBack }: ReservationHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={["#0066FF", "#00B4D8"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        paddingTop: insets.top + 16,
        paddingVertical: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
      }}
    >
      {canGoBack && (
        <TouchableOpacity
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "rgba(255,255,255,0.2)",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 12,
          }}
          onPress={onGoBack}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
      )}
      <Text
        style={{
          fontSize: 26,
          fontWeight: "700",
          color: "#fff",
        }}
      >
        Đặt trước của tôi
      </Text>
      <Text
        style={{
          marginTop: 6,
          fontSize: 14,
          color: "rgba(255,255,255,0.85)",
        }}
      >
        Quản lý các lượt đặt trước và bắt đầu chuyến đi nhanh chóng.
      </Text>
    </LinearGradient>
  );
}
