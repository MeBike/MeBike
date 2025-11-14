import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { BikeColors } from "@constants/BikeColors";

import { formatDisplayDate } from "../utils";

type Props = {
  dates: string[];
};

export function DateChips({ dates }: Props) {
  if (dates.length === 0) return null;

  return (
    <View style={styles.container}>
      {dates.map((date) => (
        <View key={date} style={styles.chip}>
          <Text style={styles.text}>{formatDisplayDate(date)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
  },
  text: {
    fontWeight: "600",
    color: BikeColors.textPrimary,
  },
});
