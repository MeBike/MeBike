import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
};

function InfoCard({ title, icon, children }: Props) {
  return (
    <View style={styles.infoCard}>
      <View style={styles.cardHeader}>
        <Ionicons name={icon} size={24} color="#0066FF" />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export const styles = StyleSheet.create({
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E3E8F2",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.045,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
    marginLeft: 8,
  },
});

export default InfoCard;
