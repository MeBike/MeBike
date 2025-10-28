import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { BikeColors } from "@/constants/BikeColors";

import { IconSymbol } from "./IconSymbol";

type MapPlaceholderProps = {
  title?: string;
  subtitle?: string;
};

export function MapPlaceholder({
  title = "Bản đồ không khả dụng",
  subtitle = "react-native-maps hiện không được hỗ trợ trong Natively",
}: MapPlaceholderProps) {
  return (
    <View style={styles.container}>
      <IconSymbol name="map.fill" size={64} color={BikeColors.onSurfaceVariant} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.mockMap}>
        <View style={styles.mockPin}>
          <IconSymbol name="location.fill" size={24} color={BikeColors.error} />
        </View>
        <Text style={styles.mockMapText}>Vị trí hiện tại</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BikeColors.surfaceVariant,
    padding: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: BikeColors.onSurface,
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: BikeColors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
  },
  mockMap: {
    width: "100%",
    height: 200,
    backgroundColor: BikeColors.surface,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: BikeColors.divider,
    borderStyle: "dashed",
  },
  mockPin: {
    marginBottom: 8,
  },
  mockMapText: {
    fontSize: 16,
    fontWeight: "500",
    color: BikeColors.onSurfaceVariant,
  },
});
