import { BikeColors } from "@constants/BikeColors";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { TomTomAddressSuggestion } from "../lib/tomtom";

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 12,
    marginTop: 10,
    borderColor: BikeColors.divider,
    borderWidth: 1,
    overflow: "hidden",
  },
  item: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  divider: {
    height: 1,
    backgroundColor: BikeColors.divider,
  },
  address: {
    color: BikeColors.textPrimary,
    fontWeight: "600",
    fontSize: 13,
  },
  coords: {
    marginTop: 2,
    fontSize: 12,
    color: BikeColors.textSecondary,
  },
});

type LocationSuggestionsProps = {
  suggestions: TomTomAddressSuggestion[];
  onSelect: (item: TomTomAddressSuggestion) => void;
};

export function LocationSuggestions({ suggestions, onSelect }: LocationSuggestionsProps) {
  if (suggestions.length === 0) {
    return null;
  }

  const items = suggestions.slice(0, 6);

  return (
    <View style={styles.container}>
      {items.map((item, idx) => (
        <View key={`${item.address}-${idx}`}>
          <Pressable style={styles.item} onPress={() => onSelect(item)}>
            <Text style={styles.address}>{item.address}</Text>
            <Text style={styles.coords}>
              (
              {item.latitude}
              ,
              {" "}
              {item.longitude}
              )
            </Text>
          </Pressable>
          {idx === items.length - 1 ? null : <View style={styles.divider} />}
        </View>
      ))}
    </View>
  );
}
