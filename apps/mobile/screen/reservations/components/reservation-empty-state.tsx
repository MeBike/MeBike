import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type ReservationEmptyStateProps = {
  message: string;
};
const styles = StyleSheet.create({
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: "#90A4AE",
    textAlign: "center",
  },
});
export function ReservationEmptyState({ message }: ReservationEmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={40} color="#B0BEC5" />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}
