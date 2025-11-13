import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
};

const InfoCard = ({ title, icon, children }: Props) => {
  return (
    <View style={styles.infoCard}>
      <View style={styles.cardHeader}>
        <Ionicons name={icon} size={24} color="#0066FF" />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
};

export const styles = StyleSheet.create({
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
});

export default InfoCard;
