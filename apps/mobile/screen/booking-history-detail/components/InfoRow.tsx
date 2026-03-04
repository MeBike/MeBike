import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  label: string;
  value: string;
};

const InfoRow = ({ label, value }: Props) => {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EDEFF3",
  },
  infoLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1F2937",
    textAlign: "right",
    flex: 1,
    marginLeft: 16,
    lineHeight: 20,
  },
});

export default InfoRow;
